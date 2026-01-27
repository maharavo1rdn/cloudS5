import express from 'express';
import Point from '../models/Point.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import PointStatut from '../models/PointStatut.js';
import firebaseService from '../services/firebaseService.js';
import { Op } from 'sequelize';

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
    const statutIds = new Set(pointStatuts.map(ps => ps.id));
    const defaultStatutId = statutByCode.get('A_FAIRE') || pointStatuts[0]?.id || null;

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
            await existingPoint.update({
              probleme_id: fbPoint.probleme_id || null,
              surface_m2: fbPoint.surface_m2 ?? null,
              budget: fbPoint.budget ?? null,
              entreprise_id: fbPoint.entreprise_id || null,
              date_detection: fbPoint.date_detection || existingPoint.date_detection,
              date_debut: fbPoint.date_debut || null,
              date_fin: fbPoint.date_fin || null,
              avancement_pourcentage: fbPoint.avancement_pourcentage ?? existingPoint.avancement_pourcentage,
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
          await Point.create({
            probleme_id: resolvedProblemeId,
            surface_m2: fbPoint.surface_m2 ?? null,
            budget: fbPoint.budget ?? null,
            entreprise_id: resolvedEntrepriseId,
            date_detection: fbPoint.date_detection || new Date(),
            date_debut: fbPoint.date_debut || null,
            date_fin: fbPoint.date_fin || null,
            avancement_pourcentage: fbPoint.avancement_pourcentage ?? 0,
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
          firebase_id: point.firebase_id,
          probleme_id: point.probleme_id,
          surface_m2: point.surface_m2 ? parseFloat(point.surface_m2) : null,
          budget: point.budget ? parseFloat(point.budget) : null,
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
 *     summary: Synchronisation complète bidirectionnelle
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
    
    console.log('🔄 Début synchronisation complète');
    
    const syncReport = {
      started_at: new Date().toISOString(),
      pull: null,
      push: null,
      completed_at: null,
      success: false
    };

    // Étape 1: Pull (récupérer depuis Firebase)
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

    // Étape 2: Push (envoyer vers Firebase) 
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

    syncReport.completed_at = new Date().toISOString();
    syncReport.success = !syncReport.pull?.error && !syncReport.push?.error;

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

export default router;