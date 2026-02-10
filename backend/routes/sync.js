import express from 'express';
import admin from 'firebase-admin';
import Point from '../models/Point.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import PointStatut from '../models/PointStatut.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import firebaseService from '../services/firebaseService.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

/**
 * @swagger
 * /api/sync/status:
 *   get:
 *     summary: Obtenir le statut de synchronisation
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Statut de synchronisation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firebase_available:
 *                   type: boolean
 *                 last_sync_at:
 *                   type: string
 *                   format: date-time
 *                 pending_local_changes:
 *                   type: integer
 */
router.get('/status', async (req, res) => {
  try {
    // Vérifier la disponibilité Firebase
    let firebaseAvailable = false;
    try {
      await firebaseService.initialize();
      firebaseAvailable = true;
    } catch (error) {
      console.warn('Firebase non disponible:', error.message);
    }

    // Compter les changements en attente (points modifiés depuis la dernière sync)
    const pendingChanges = await Point.count({
      where: {
        [Op.or]: [
          { last_synced_at: null },
          { updated_at: { [Op.gt]: Point.sequelize.col('last_synced_at') } }
        ]
      }
    });

    // Obtenir la dernière synchronisation
    const lastSyncRecord = await Point.findOne({
      where: { last_synced_at: { [Op.not]: null } },
      order: [['last_synced_at', 'DESC']],
      attributes: ['last_synced_at']
    });

    res.json({
      firebase_available: firebaseAvailable,
      last_sync_at: lastSyncRecord?.last_synced_at || null,
      pending_local_changes: pendingChanges,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur statut sync:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

/**
 * @swagger
 * /api/sync/pull:
 *   post:
 *     summary: Récupérer les données depuis Firebase
 *     tags: [Synchronisation]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               since:
 *                 type: string
 *                 format: date-time
 *                 description: Récupérer seulement les modifications depuis cette date
 *     responses:
 *       200:
 *         description: Données synchronisées avec succès
 */
router.post('/pull', async (req, res) => {
  try {
    const { since } = req.body;
    
    console.log(`🔄 Début pull Firebase${since ? ` depuis ${since}` : ''}`);
    
    // Récupérer les points depuis Firebase
    const firebasePoints = await firebaseService.getPointsFromFirebase(since);

    // Préparer le mapping des statuts Firebase -> SQL
    const pointStatuts = await PointStatut.findAll();
    const statutByCode = new Map(pointStatuts.map(ps => [ps.code, ps.id]));
    const statutById = new Map(pointStatuts.map(ps => [ps.id, ps.code]));
    const statutIds = new Set(pointStatuts.map(ps => ps.id));
    const defaultStatutId = statutByCode.get('A_FAIRE') || pointStatuts[0]?.id || null;

    // Mapping status -> avancement (server-side business rule)
    const statutToAvancement = {
      'A_FAIRE': 0,
      'EN_COURS': 50,
      'TERMINE': 100,
      'NOUVEAU': 0
    };

    const resolvePointStatutId = (fbPoint) => {
      // Priorité: id déjà présent et valide
      if (fbPoint.point_statut_id && statutIds.has(fbPoint.point_statut_id)) {
        return fbPoint.point_statut_id;
      }

      // Essayer les codes connus (point_statut, statut)
      const candidates = [fbPoint.point_statut, fbPoint.statut, fbPoint.status];
      for (const candidate of candidates) {
        if (!candidate) continue;
        const normalized = typeof candidate === 'string' ? candidate.toUpperCase() : candidate;
        if (statutByCode.has(normalized)) {
          return statutByCode.get(normalized);
        }
      }

      return defaultStatutId;
    };
    
    const results = {
      received: firebasePoints.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    // Pour chaque point Firebase, l'intégrer en base locale
    for (const fbPoint of firebasePoints) {
      try {
        const resolvedPointStatutId = resolvePointStatutId(fbPoint);

        // Chercher si le point existe déjà (via firebase_id)
        let existingPoint = await Point.findOne({
          where: { firebase_id: fbPoint.firebase_id }
        });

        if (existingPoint) {
          // Mettre à jour si le point Firebase est plus récent
          const fbUpdatedAt = fbPoint.updated_at ? new Date(fbPoint.updated_at) : new Date();
          const localUpdatedAt = new Date(existingPoint.updated_at);
          
          if (fbUpdatedAt > localUpdatedAt) {
            // Determine avancement based on resolved statut (server-side rule)
            const resolvedStatutCode = statutById.get(resolvedPointStatutId) || null;
            const computedAvancement = (resolvedStatutCode && statutToAvancement[resolvedStatutCode] !== undefined)
              ? statutToAvancement[resolvedStatutCode]
              : (fbPoint.avancement_pourcentage ?? existingPoint.avancement_pourcentage);

            await existingPoint.update({
              nom: fbPoint.nom || existingPoint.nom,
              description: fbPoint.description || existingPoint.description,
              probleme_id: fbPoint.probleme_id || null,
              surface_m2: fbPoint.surface_m2 ?? null,
              // Budget immutable: ne pas écraser si déjà défini localement
              budget: (existingPoint.budget != null && parseFloat(existingPoint.budget) > 0)
                ? existingPoint.budget
                : (fbPoint.budget ?? null),
              niveau: fbPoint.niveau ?? null,
              prix_par_m2: fbPoint.prix_par_m2 ?? null,
              entreprise_id: fbPoint.entreprise_id || null,
              date_detection: fbPoint.date_detection || existingPoint.date_detection,
              date_debut: fbPoint.date_debut || null,
              date_fin: fbPoint.date_fin || null,
              avancement_pourcentage: computedAvancement,
              latitude: fbPoint.latitude ?? existingPoint.latitude,
              longitude: fbPoint.longitude ?? existingPoint.longitude,
              point_statut_id: resolvedPointStatutId,
              updated_at: fbUpdatedAt,
              firebase_id: fbPoint.firebase_id,
              last_synced_at: new Date()
            });
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Avant création, s'assurer que les FK référencées existent (probleme, entreprise)
          let resolvedProblemeId = fbPoint.probleme_id || null;
          let resolvedEntrepriseId = fbPoint.entreprise_id || null;

          // Vérifier probleme
          if (resolvedProblemeId) {
            const pb = await Probleme.findByPk(resolvedProblemeId);
            if (!pb) {
              // Tenter de récupérer la donnée depuis Firebase 'problemes' collection
              try {
                const doc = await firebaseService.db.collection('problemes').doc(String(resolvedProblemeId)).get();
                if (doc.exists) {
                  const data = doc.data();
                  const newPb = await Probleme.create({ nom: data.nom || `Probleme ${resolvedProblemeId}`, description: data.description || null });
                  resolvedProblemeId = newPb.id;
                } else {
                  // not found, unset
                  resolvedProblemeId = null;
                }
              } catch (err) {
                console.warn('Impossible récupérer probleme depuis Firebase', err.message);
                resolvedProblemeId = null;
              }
            }
          }

          // Vérifier entreprise
          if (resolvedEntrepriseId) {
            const ent = await Entreprise.findByPk(resolvedEntrepriseId);
            if (!ent) {
              try {
                const doc = await firebaseService.db.collection('entreprises').doc(String(resolvedEntrepriseId)).get();
                if (doc.exists) {
                  const data = doc.data();
                  const newEnt = await Entreprise.create({ nom: data.nom || `Entreprise ${resolvedEntrepriseId}` });
                  resolvedEntrepriseId = newEnt.id;
                } else {
                  resolvedEntrepriseId = null;
                }
              } catch (err) {
                console.warn('Impossible récupérer entreprise depuis Firebase', err.message);
                resolvedEntrepriseId = null;
              }
            }
          }

          // Créer nouveau point avec FK résolues
          // Compute avancement based on resolved statut (server-side rule)
          const resolvedStatutCodeForCreate = statutById.get(resolvedPointStatutId) || null;
          const computedAvancementForCreate = (resolvedStatutCodeForCreate && statutToAvancement[resolvedStatutCodeForCreate] !== undefined)
            ? statutToAvancement[resolvedStatutCodeForCreate]
            : (fbPoint.avancement_pourcentage ?? 0);

          await Point.create({
            nom: fbPoint.nom || 'Signalement',
            description: fbPoint.description || null,
            probleme_id: resolvedProblemeId,
            surface_m2: fbPoint.surface_m2 ?? null,
            budget: fbPoint.budget ?? null,
            niveau: fbPoint.niveau ?? null,
            prix_par_m2: fbPoint.prix_par_m2 ?? null,
            entreprise_id: resolvedEntrepriseId,
            date_detection: fbPoint.date_detection || new Date(),
            date_debut: fbPoint.date_debut || null,
            date_fin: fbPoint.date_fin || null,
            avancement_pourcentage: computedAvancementForCreate,
            latitude: fbPoint.latitude ?? null,
            longitude: fbPoint.longitude ?? null,
            point_statut_id: resolvedPointStatutId,
            firebase_id: fbPoint.firebase_id,
            created_at: fbPoint.created_at || new Date(),
            updated_at: fbPoint.updated_at || new Date(),
            last_synced_at: new Date()
          });
          results.created++;
        }
      } catch (error) {
        console.error(`Erreur traitement point ${fbPoint.firebase_id}:`, error);
        results.errors.push({
          firebase_id: fbPoint.firebase_id,
          error: error.message
        });
      }
    }

    console.log(`✅ Pull terminé: ${results.created} créés, ${results.updated} mis à jour`);
    res.json(results);

  } catch (error) {
    console.error('Erreur pull Firebase:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération depuis Firebase',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/push:
 *   post:
 *     summary: Envoyer les données locales vers Firebase
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Données envoyées avec succès
 */
router.post('/push', async (req, res) => {
  try {
    console.log('🔄 Début push vers Firebase');
    
    // Récupérer les points locaux modifiés depuis la dernière sync
    const pendingPoints = await Point.findAll({
      where: {
        [Op.or]: [
          { last_synced_at: null },
          { updated_at: { [Op.gt]: Point.sequelize.col('last_synced_at') } }
        ]
      },
      include: [
        { model: Probleme, as: 'probleme' },
        { model: Entreprise, as: 'entreprise' },
        { model: PointStatut, as: 'statut' }
      ]
    });

    const results = {
      total: pendingPoints.length,
      created: [],
      updated: [],
      rejected: []
    };

    // Traiter chaque point en attente
    for (const point of pendingPoints) {
      try {
        const operation = point.firebase_id ? 'update' : 'create';
        
        // Résoudre le code de statut (push envoie le code lisible dans Firebase)
        let statutCode = point.statut?.code;
        if (!statutCode && point.point_statut_id) {
          const ps = await PointStatut.findByPk(point.point_statut_id);
          statutCode = ps?.code || null;
        }
        statutCode = statutCode || 'A_FAIRE';

        // Préparer les données pour Firebase (exclure les relations Sequelize)
        const pointData = {
          id: point.id,
          nom: point.nom || 'Signalement',
          description: point.description || null,
          firebase_id: point.firebase_id,
          probleme_id: point.probleme_id,
          surface_m2: point.surface_m2 ? parseFloat(point.surface_m2) : null,
          budget: point.budget ? parseFloat(point.budget) : null,
          niveau: point.niveau ?? null,
          prix_par_m2: point.prix_par_m2 ? parseFloat(point.prix_par_m2) : null,
          entreprise_id: point.entreprise_id,
          date_detection: point.date_detection,
          date_debut: point.date_debut,
          date_fin: point.date_fin,
          avancement_pourcentage: point.avancement_pourcentage,
          latitude: point.latitude ? parseFloat(point.latitude) : null,
          longitude: point.longitude ? parseFloat(point.longitude) : null,
          // envoyer le code de statut lisible (A_FAIRE|EN_COURS|TERMINE) pour compatibilité Firebase
          point_statut: statutCode,
          point_statut_id: point.point_statut_id,
          created_at: point.created_at,
          updated_at: point.updated_at
        };

        // Synchroniser avec Firebase
        const syncResult = await firebaseService.syncPointToFirebase(pointData, operation);
        
        // Mettre à jour l'enregistrement local
        await point.update({
          firebase_id: syncResult.firebase_id,
          last_synced_at: new Date()
        });

        if (operation === 'create') {
          results.created.push({
            local_id: point.id,
            firebase_id: syncResult.firebase_id
          });
        } else {
          results.updated.push({
            local_id: point.id,
            firebase_id: syncResult.firebase_id
          });
        }

      } catch (error) {
        console.error(`Erreur sync point ${point.id}:`, error);
        results.rejected.push({
          local_id: point.id,
          reason: error.message,
          error: error.code || 'unknown',
          stack: error.stack
        });
      }
    }

    console.log(`✅ Push terminé: ${results.created.length} créés, ${results.updated.length} mis à jour, ${results.rejected.length} rejetés`);
    res.json(results);

  } catch (error) {
    console.error('Erreur push Firebase:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi vers Firebase',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/full:
 *   post:
 *     summary: Synchronisation complète bidirectionnelle (points + images + historique + utilisateurs)
 *     tags: [Synchronisation]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 description: Forcer la synchronisation même en cas de conflits
 *     responses:
 *       200:
 *         description: Synchronisation complète terminée
 */
router.post('/full', async (req, res) => {
  try {
    const { force = false } = req.body;
    
    console.log('🔄 Début synchronisation complète (points + images + histo + users)');
    
    const syncReport = {
      started_at: new Date().toISOString(),
      pull: null,
      push: null,
      users_pull: null,
      users_push: null,
      images_histo: null,
      completed_at: null,
      success: false
    };

    // Étape 1: Pull points (récupérer depuis Firebase)
    try {
      const pullResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: force ? null : undefined })
      });
      
      if (pullResponse.ok) {
        syncReport.pull = await pullResponse.json();
      } else {
        throw new Error(`Pull failed: ${pullResponse.status}`);
      }
    } catch (error) {
      syncReport.pull = { error: error.message };
      if (!force) {
        throw error;
      }
    }

    // Étape 2: Push points (envoyer vers Firebase) 
    try {
      const pushResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (pushResponse.ok) {
        syncReport.push = await pushResponse.json();
      } else {
        throw new Error(`Push failed: ${pushResponse.status}`);
      }
    } catch (error) {
      syncReport.push = { error: error.message };
      if (!force) {
        throw error;
      }
    }

    // Étape 3: Pull utilisateurs
    try {
      const usersPullResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sync/users/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (usersPullResponse.ok) {
        syncReport.users_pull = await usersPullResponse.json();
      } else {
        throw new Error(`Users pull failed: ${usersPullResponse.status}`);
      }
    } catch (error) {
      syncReport.users_pull = { error: error.message };
      if (!force) {
        throw error;
      }
    }

    // Étape 4: Push utilisateurs
    try {
      const usersPushResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sync/users/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (usersPushResponse.ok) {
        syncReport.users_push = await usersPushResponse.json();
      } else {
        throw new Error(`Users push failed: ${usersPushResponse.status}`);
      }
    } catch (error) {
      syncReport.users_push = { error: error.message };
      if (!force) {
        throw error;
      }
    }

    // Étape 5: Sync images et historique
    try {
      const imagesHistoResponse = await fetch(`${req.protocol}://${req.get('host')}/api/sync/images-histo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (imagesHistoResponse.ok) {
        syncReport.images_histo = await imagesHistoResponse.json();
      } else {
        throw new Error(`Images/histo sync failed: ${imagesHistoResponse.status}`);
      }
    } catch (error) {
      syncReport.images_histo = { error: error.message };
      if (!force) {
        throw error;
      }
    }

    syncReport.completed_at = new Date().toISOString();
    syncReport.success = !syncReport.pull?.error && !syncReport.push?.error && 
                         !syncReport.users_pull?.error && !syncReport.users_push?.error &&
                         !syncReport.images_histo?.error;

    console.log('✅ Synchronisation complète terminée:', syncReport.success ? 'SUCCÈS' : 'ERREURS');
    res.json(syncReport);

  } catch (error) {
    console.error('Erreur synchronisation complète:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la synchronisation complète',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/users/pull:
 *   post:
 *     summary: Récupérer les utilisateurs depuis Firebase
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Utilisateurs synchronisés
 */
router.post('/users/pull', async (req, res) => {
  try {
    console.log('🔄 Début pull utilisateurs Firebase');
    
    const usersSnapshot = await firebaseService.db.collection('users').get();
    
    const results = {
      received: usersSnapshot.size,
      created: 0,
      updated: 0,
      errors: []
    };

    for (const userDoc of usersSnapshot.docs) {
      try {
        const fbUser = userDoc.data();
        
        // Skip si pas d'email (utilisateurs Firebase Auth sans données user)
        if (!fbUser.email) {
          console.warn(`⚠️ User Firebase ${userDoc.id} sans email, skip`);
          continue;
        }
        
        // Chercher l'utilisateur par firebase_uid ou email
        let existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { firebase_uid: userDoc.id },
              { email: fbUser.email }
            ]
          }
        });

        if (existingUser) {
          // Mettre à jour si Firebase est plus récent
          const fbUpdatedAt = fbUser.updatedAt?.toDate?.() || fbUser.createdAt?.toDate?.() || new Date();
          const localUpdatedAt = existingUser.updated_at || existingUser.created_at;
          
          if (fbUpdatedAt > localUpdatedAt) {
            const updateData = {
              firebase_uid: userDoc.id,
              username: fbUser.username || existingUser.username,
              isBlocked: !!fbUser.blocked,
              last_synced_at: new Date()
            };
            
            // Si Firebase contient un password hashé, on le stocke SANS le re-hasher
            if (fbUser.password) {
              updateData.password = fbUser.password;
            }
            
            await existingUser.update(updateData);
            results.updated++;
          }
        } else {
          let desiredUsername = fbUser.username || `user_${userDoc.id.substring(0, 10)}`;

          const usernameOwner = await User.findOne({ where: { username: desiredUsername } });
          if (usernameOwner) {
            if (usernameOwner.email === fbUser.email) {
              await usernameOwner.update({
                firebase_uid: userDoc.id,
                password: fbUser.password || usernameOwner.password,
                last_synced_at: new Date()
              });
              results.updated++;
              continue;
            }

            desiredUsername = `${desiredUsername}_${userDoc.id.substring(0,6)}`;
          }

          const newUserData = {
            firebase_uid: userDoc.id,
            email: fbUser.email,
            username: desiredUsername,
            password: fbUser.password || 'FIREBASE_AUTH_PLACEHOLDER',
            role_id: fbUser.role == 'manager' ? 
              (await sequelize.models.Role.findOne({ where: { name: 'manager' } }))?.id :
              (await sequelize.models.Role.findOne({ where: { name: 'utilisateur' } }))?.id,
            isBlocked: !!fbUser.blocked,
            last_synced_at: new Date()
          };

          try {
            await User.create(newUserData);
            results.created++;
          } catch (createErr) {
            console.warn(`Tentative création utilisateur a échoué pour ${newUserData.email}: ${createErr.message}`);
            if (createErr && createErr.original && createErr.original.constraint && createErr.original.constraint.includes('users_username')) {
              newUserData.username = `${newUserData.username}_${Math.floor(Math.random() * 9000) + 1000}`;
              try {
                await User.create(newUserData);
                results.created++;
              } catch (retryErr) {
                console.error(`Réessai création utilisateur échoué pour ${newUserData.email}:`, retryErr.message || retryErr);
                results.errors.push({ firebase_id: userDoc.id, error: retryErr.message || String(retryErr) });
              }
            } else {
              console.error(`Erreur création utilisateur ${userDoc.id}:`, createErr.message || createErr);
              results.errors.push({ firebase_id: userDoc.id, error: createErr.message || String(createErr) });
            }
          }
        }
      } catch (error) {
        console.error(`Erreur sync user ${userDoc.id}:`, error);
        results.errors.push({
          firebase_id: userDoc.id,
          error: error.message
        });
      }
    }

    console.log(`✅ Pull utilisateurs: ${results.created} créés, ${results.updated} mis à jour`);
    res.json(results);

  } catch (error) {
    console.error('Erreur pull utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des utilisateurs',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/users/push:
 *   post:
 *     summary: Envoyer les utilisateurs locaux vers Firebase
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Utilisateurs synchronisés
 */
router.post('/users/push', async (req, res) => {
  try {
    console.log('🔄 Début push utilisateurs vers Firebase');
    
    // Utilisateurs locaux pas encore synchronisés ou modifiés
    const pendingUsers = await User.findAll({
      where: {
        [Op.or]: [
          { last_synced_at: null },
          { updatedAt: { [Op.gt]: User.sequelize.col('last_synced_at') } }
        ]
      }
    });

    const results = {
      total: pendingUsers.length,
      created: 0,
      updated: 0,
      errors: []
    };

    for (const user of pendingUsers) {
      try {
        const userData = {
          email: user.email,
          username: user.username,
          // Envoyer le password déjà hashé depuis la base locale
          password: user.password,
          role: (await user.getRole())?.name === 'manager' ? 'manager' : 'user',
          blocked: !!user.isBlocked,
          createdAt: admin.firestore.Timestamp.fromDate(user.createdAt || new Date()),
          updatedAt: admin.firestore.Timestamp.fromDate(user.updatedAt || new Date())
        };

        if (user.firebase_uid) {
          // Mettre à jour
          await firebaseService.db.collection('users').doc(user.firebase_uid).update(userData);
          results.updated++;
        } else {
          // Créer nouveau document (utiliser l'email comme ID si pas de firebase_uid)
          const docRef = await firebaseService.db.collection('users').add(userData);
          await user.update({
            firebase_uid: docRef.id,
            last_synced_at: new Date()
          });
          results.created++;
        }

        await user.update({ last_synced_at: new Date() });

      } catch (error) {
        console.error(`Erreur sync user ${user.id}:`, error);
        results.errors.push({
          local_id: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    console.log(`✅ Push utilisateurs: ${results.created} créés, ${results.updated} mis à jour`);
    res.json(results);

  } catch (error) {
    console.error('Erreur push utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi des utilisateurs',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/images-histo:
 *   post:
 *     summary: Synchroniser les images et l'historique des points
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Images et historique synchronisés
 */
router.post('/images-histo', async (req, res) => {
  try {
    console.log('🔄 Début sync images et historique');
    
    const results = {
      images: { pulled: 0, pushed: 0 },
      historique: { pulled: 0, pushed: 0 },
      errors: []
    };

    // Récupérer tous les points ayant un firebase_id
    const points = await Point.findAll({
      where: { firebase_id: { [Op.not]: null } }
    });

    for (const point of points) {
      try {
        const pointRef = firebaseService.db.collection('points').doc(point.firebase_id);

        // === PULL: Images depuis Firebase ===
        const imagesSnapshot = await pointRef.collection('images').get();
        for (const imgDoc of imagesSnapshot.docs) {
          const imgData = imgDoc.data();
          
          // Vérifier si l'image existe déjà localement
          const [pointImage] = await sequelize.query(
            'SELECT id FROM points_images WHERE firebase_id = :firebase_id OR (point_id = :point_id AND image_url = :image_url)',
            {
              replacements: {
                firebase_id: imgDoc.id,
                point_id: point.id,
                image_url: imgData.image_url || imgData.firebase_url
              },
              type: sequelize.QueryTypes.SELECT
            }
          );

          if (!pointImage) {
            await sequelize.query(
              'INSERT INTO points_images (point_id, image_url, firebase_id, created_at, last_synced_at) VALUES (:point_id, :image_url, :firebase_id, :created_at, NOW())',
              {
                replacements: {
                  point_id: point.id,
                  image_url: imgData.image_url || imgData.firebase_url,
                  firebase_id: imgDoc.id,
                  created_at: imgData.created_at?.toDate?.() || new Date()
                }
              }
            );
            results.images.pulled++;
          }
        }

        // === PULL: Historique depuis Firebase ===
        const histoSnapshot = await pointRef.collection('historique').get();
        for (const histoDoc of histoSnapshot.docs) {
          const histoData = histoDoc.data();

          // Skip if no point_statut provided
          if (!histoData.point_statut) {
            console.warn(`⚠️ Historique Firebase ${histoDoc.id} pour point ${point.id} sans 'point_statut', skip`);
            results.errors.push({ point_id: point.id, error: `historique ${histoDoc.id} missing point_statut` });
            continue;
          }
          
          // Extraire le code de point_statut (peut être string ou objet)
          let statutCode = histoData.point_statut;
          if (typeof statutCode === 'object' && statutCode !== null) {
            statutCode = statutCode.code || null;
          }

          if (!statutCode) {
            console.warn(`⚠️ Historique Firebase ${histoDoc.id} - point_statut invalide:`, histoData.point_statut);
            results.errors.push({ point_id: point.id, error: `historique ${histoDoc.id} invalid point_statut` });
            continue;
          }
          
          // Récupérer le point_statut_id depuis le code
          let pointStatut;
          try {
            [pointStatut] = await sequelize.query(
              'SELECT id FROM point_statut WHERE code = :code',
              {
                replacements: { code: statutCode },
                type: sequelize.QueryTypes.SELECT
              }
            );
          } catch (err) {
            console.error(`Erreur récup statut pour historique ${histoDoc.id} (point ${point.id}):`, err.message || err);
            results.errors.push({ point_id: point.id, error: `statut lookup failed for histo ${histoDoc.id}: ${err.message || err}` });
            continue; // skip this histo
          }

          const [histoExists] = await sequelize.query(
            'SELECT id FROM points_histo WHERE firebase_id = :firebase_id',
            {
              replacements: { firebase_id: histoDoc.id },
              type: sequelize.QueryTypes.SELECT
            }
          );

          if (!histoExists && pointStatut) {
            await sequelize.query(
              'INSERT INTO points_histo (point_id, point_statut_id, avancement_pourcentage, date, firebase_id, last_synced_at) VALUES (:point_id, :point_statut_id, :avancement, :date, :firebase_id, NOW())',
              {
                replacements: {
                  point_id: point.id,
                  point_statut_id: pointStatut.id,
                  avancement: histoData.avancement_pourcentage || 0,
                  date: histoData.date?.toDate?.() || new Date(),
                  firebase_id: histoDoc.id
                }
              }
            );
            results.historique.pulled++;
          } else if (!pointStatut) {
            console.warn(`⚠️ Statut inconnu pour historique ${histoDoc.id} (code=${histoData.point_statut})`);
            results.errors.push({ point_id: point.id, error: `unknown statut ${histoData.point_statut}` });
          }
        }

        // === PUSH: Images locales vers Firebase ===
        const localImages = await sequelize.query(
          'SELECT * FROM points_images WHERE point_id = :point_id AND (last_synced_at IS NULL OR firebase_id IS NULL)',
          {
            replacements: { point_id: point.id },
            type: sequelize.QueryTypes.SELECT
          }
        );

        for (const img of localImages) {
          try {
            const imgData = {
              image_url: img.image_url,
              firebase_url: img.image_url,
              created_at: admin.firestore.Timestamp.fromDate(img.created_at || new Date())
            };

            if (img.firebase_id) {
              await pointRef.collection('images').doc(img.firebase_id).set(imgData);
            } else {
              const newImgRef = await pointRef.collection('images').add(imgData);
              await sequelize.query(
                'UPDATE points_images SET firebase_id = :firebase_id, last_synced_at = NOW() WHERE id = :id',
                { replacements: { firebase_id: newImgRef.id, id: img.id } }
              );
            }
            results.images.pushed++;
          } catch (err) {
            console.warn(`Erreur push image ${img.id}:`, err.message);
          }
        }

        // === PUSH: Historique local vers Firebase ===
        const localHisto = await sequelize.query(
          `SELECT ph.*, ps.code as statut_code 
           FROM points_histo ph 
           JOIN point_statut ps ON ph.point_statut_id = ps.id 
           WHERE ph.point_id = :point_id AND (ph.last_synced_at IS NULL OR ph.firebase_id IS NULL)`,
          {
            replacements: { point_id: point.id },
            type: sequelize.QueryTypes.SELECT
          }
        );

        for (const histo of localHisto) {
          try {
            const histoData = {
              point_statut: histo.statut_code,
              avancement_pourcentage: histo.avancement_pourcentage || 0,
              date: admin.firestore.Timestamp.fromDate(histo.date || new Date())
            };

            if (histo.firebase_id) {
              await pointRef.collection('historique').doc(histo.firebase_id).set(histoData);
            } else {
              const newHistoRef = await pointRef.collection('historique').add(histoData);
              await sequelize.query(
                'UPDATE points_histo SET firebase_id = :firebase_id, last_synced_at = NOW() WHERE id = :id',
                { replacements: { firebase_id: newHistoRef.id, id: histo.id } }
              );
            }
            results.historique.pushed++;
          } catch (err) {
            console.warn(`Erreur push historique ${histo.id}:`, err.message);
          }
        }

      } catch (error) {
        console.error(`Erreur sync images/histo point ${point.id}:`, error);
        results.errors.push({
          point_id: point.id,
          error: error.message
        });
      }
    }

    console.log(`✅ Sync images: ${results.images.pulled} pull, ${results.images.pushed} push`);
    console.log(`✅ Sync historique: ${results.historique.pulled} pull, ${results.historique.pushed} push`);
    res.json(results);

  } catch (error) {
    console.error('Erreur sync images/historique:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la synchronisation images/historique',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/settings/pull:
 *   post:
 *     summary: Récupérer les paramètres depuis Firebase
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Paramètres synchronisés avec succès
 */
router.post('/settings/pull', async (req, res) => {
  try {
    console.log('🔄 Début pull settings depuis Firebase');
    
    const settingsSnapshot = await firebaseService.db.collection('settings').get();
    
    const results = {
      received: settingsSnapshot.size,
      created: 0,
      updated: 0,
      errors: []
    };

    for (const doc of settingsSnapshot.docs) {
      try {
        const data = doc.data();
        const code = data.code || doc.id;

        const [existingSetting] = await Setting.findOrCreate({
          where: { code },
          defaults: {
            code,
            value: data.value || '',
            type: data.type || 'string',
            date: data.date?.toDate?.() || new Date()
          }
        });

        if (existingSetting) {
          await existingSetting.update({
            value: data.value || existingSetting.value,
            type: data.type || existingSetting.type,
            date: data.date?.toDate?.() || existingSetting.date
          });
          results.updated++;
        } else {
          results.created++;
        }
      } catch (error) {
        console.error(`Erreur traitement setting ${doc.id}:`, error);
        results.errors.push({ code: doc.id, error: error.message });
      }
    }

    console.log(`✅ Pull settings terminé: ${results.created} créés, ${results.updated} mis à jour`);
    res.json(results);

  } catch (error) {
    console.error('Erreur pull settings Firebase:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des paramètres depuis Firebase',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/sync/settings/push:
 *   post:
 *     summary: Envoyer les paramètres locaux vers Firebase
 *     tags: [Synchronisation]
 *     responses:
 *       200:
 *         description: Paramètres envoyés avec succès
 */
router.post('/settings/push', async (req, res) => {
  try {
    console.log('🔄 Début push settings vers Firebase');
    
    const settings = await Setting.findAll();
    
    const results = {
      total: settings.length,
      synced: 0,
      errors: []
    };

    for (const setting of settings) {
      try {
        await firebaseService.db.collection('settings').doc(setting.code).set({
          code: setting.code,
          value: setting.value,
          type: setting.type,
          date: admin.firestore.Timestamp.fromDate(setting.date || new Date())
        });
        results.synced++;
      } catch (error) {
        console.error(`Erreur sync setting ${setting.code}:`, error);
        results.errors.push({ code: setting.code, error: error.message });
      }
    }

    console.log(`✅ Push settings terminé: ${results.synced} synchronisés`);
    res.json(results);

  } catch (error) {
    console.error('Erreur push settings Firebase:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi des paramètres vers Firebase',
      details: error.message 
    });
  }
});

export default router;
