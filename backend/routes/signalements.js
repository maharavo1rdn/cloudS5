import { Router } from 'express';
import Signalement from '../models/Signalement.js';
import SignalementHistorique from '../models/SignalementHistorique.js';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';
import Entreprise from '../models/Entreprise.js';
import Probleme from '../models/Probleme.js';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/signalements:
 *   get:
 *     summary: Récupérer tous les signalements (visiteurs et managers)
 *     tags: [Signalements]
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [NOUVEAU, EN_COURS, TERMINE]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des signalements
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const { statut } = req.query;
    const where = {};
    
    if (statut) {
      where.statut = statut;
    }

    const signalements = await Signalement.findAll({
      where,
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'telephone'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom'] }
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(signalements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/signalements/{id}:
 *   get:
 *     summary: Récupérer un signalement par ID
 *     tags: [Signalements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Signalement trouvé
 *       404:
 *         description: Signalement non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
  try {
    const signalement = await Signalement.findByPk(req.params.id, {
      include: [
        { model: Entreprise, as: 'entreprise' },
        { model: Probleme, as: 'probleme' },
        { 
          model: SignalementHistorique, 
          as: 'historiques',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }],
          order: [['date_modification', 'DESC']]
        }
      ],
    });

    if (!signalement) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    res.json(signalement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Middleware pour vérifier le rôle manager (level >= 5)
const requireManager = (req, res, next) => {
  console.log('[requireManager] User:', req.user);
  console.log('[requireManager] Level:', req.user?.level);
  
  if (!req.user || req.user.level < 5) {
    return res.status(403).json({ message: 'Accès refusé. Rôle manager requis.' });
  }
  next();
};

/**
 * @swagger
 * /api/signalements:
 *   post:
 *     summary: Créer un nouveau signalement (manager uniquement)
 *     tags: [Signalements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - latitude
 *               - longitude
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               probleme_id:
 *                 type: integer
 *               surface_m2:
 *                 type: number
 *               budget:
 *                 type: number
 *               entreprise_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Signalement créé
 *       400:
 *         description: Données invalides
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const {
      nom,
      description,
      latitude,
      longitude,
      probleme_id,
      surface_m2,
      budget,
      entreprise_id,
      date_debut,
      date_fin,
    } = req.body;

    if (!nom || !latitude || !longitude) {
      return res.status(400).json({ message: 'Nom, latitude et longitude sont requis' });
    }

    // Créer le signalement
    const signalement = await Signalement.create({
      nom,
      description,
      latitude,
      longitude,
      probleme_id,
      surface_m2,
      budget,
      entreprise_id,
      date_debut,
      date_fin,
    });

    // Créer automatiquement un point correspondant
    // Trouver le statut A_FAIRE pour le point
    let pointStatut = await PointStatut.findOne({ where: { code: 'A_FAIRE' } });
    if (!pointStatut) {
      // Si A_FAIRE n'existe pas, créer les statuts
      pointStatut = await PointStatut.create({ code: 'A_FAIRE', description: 'À faire' });
    }

    const point = await Point.create({
      probleme_id,
      surface_m2,
      budget,
      entreprise_id,
      date_detection: new Date(),
      date_debut,
      date_fin,
      avancement_pourcentage: 0,
      latitude,
      longitude,
      point_statut_id: pointStatut.id,
    });

    console.log('[Signalement créé] ID:', signalement.id, '+ Point ID:', point.id);

    res.status(201).json({ 
      message: 'Signalement et point créés', 
      signalement,
      point 
    });
  } catch (error) {
    console.error('[Erreur création signalement]:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/signalements/{id}:
 *   put:
 *     summary: Modifier un signalement (manager uniquement)
 *     tags: [Signalements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               surface_m2:
 *                 type: number
 *               budget:
 *                 type: number
 *               entreprise_id:
 *                 type: integer
 *               statut:
 *                 type: string
 *                 enum: [NOUVEAU, EN_COURS, TERMINE]
 *               avancement_pourcentage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Signalement modifié
 *       404:
 *         description: Signalement non trouvé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    console.log('[PUT signalement] User:', req.user);
    console.log('[PUT signalement] Body:', req.body);
    
    const signalement = await Signalement.findByPk(req.params.id);

    if (!signalement) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    // Sauvegarder les anciennes valeurs
    const ancienStatut = signalement.statut;
    const ancienAvancement = signalement.avancement_pourcentage;

    const {
      nom,
      description,
      surface_m2,
      budget,
      entreprise_id,
      probleme_id,
      statut,
      date_debut,
      date_fin,
      commentaire,
      date_modification,
    } = req.body;

    // Calculer automatiquement l'avancement selon le statut
    let avancement_pourcentage = ancienAvancement;
    if (statut) {
      switch (statut) {
        case 'NOUVEAU':
          avancement_pourcentage = 0;
          break;
        case 'EN_COURS':
          avancement_pourcentage = 50;
          break;
        case 'TERMINE':
          avancement_pourcentage = 100;
          break;
        default:
          avancement_pourcentage = ancienAvancement;
      }
    }

    // Mettre à jour le signalement
    await signalement.update({
      nom: nom ?? signalement.nom,
      description: description ?? signalement.description,
      surface_m2: surface_m2 ?? signalement.surface_m2,
      budget: budget ?? signalement.budget,
      entreprise_id: entreprise_id ?? signalement.entreprise_id,
      probleme_id: probleme_id ?? signalement.probleme_id,
      statut: statut ?? signalement.statut,
      avancement_pourcentage,
      date_debut: date_debut ?? signalement.date_debut,
      date_fin: date_fin ?? signalement.date_fin,
      synced: false,
    });

    // Créer un enregistrement dans l'historique si le statut a changé
    if (statut && statut !== ancienStatut) {
      const dateModif = date_modification ? new Date(date_modification) : new Date();
      await SignalementHistorique.create({
        signalement_id: signalement.id,
        ancien_statut: ancienStatut,
        nouveau_statut: statut,
        ancien_avancement: ancienAvancement,
        nouveau_avancement: avancement_pourcentage,
        user_id: req.user?.id || null,
        commentaire: commentaire || null,
        date_modification: dateModif,
      });

      console.log(`[Historique] Signalement ${signalement.id}: ${ancienStatut} (${ancienAvancement}%) → ${statut} (${avancement_pourcentage}%)`);
    }

    res.json({ message: 'Signalement modifié', signalement });
  } catch (error) {
    console.error('[Erreur modification signalement]:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/signalements/{id}/statut:
 *   patch:
 *     summary: Modifier uniquement le statut d'un signalement (manager uniquement)
 *     tags: [Signalements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - statut
 *             properties:
 *               statut:
 *                 type: string
 *                 enum: [NOUVEAU, EN_COURS, TERMINE]
 *               avancement_pourcentage:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Statut modifié
 *       400:
 *         description: Statut invalide
 *       404:
 *         description: Signalement non trouvé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.patch('/:id/statut', authenticateToken, requireManager, async (req, res) => {
  try {
    const { statut, avancement_pourcentage } = req.body;

    if (!statut || !['NOUVEAU', 'EN_COURS', 'TERMINE'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide. Valeurs acceptées: NOUVEAU, EN_COURS, TERMINE' });
    }

    const signalement = await Signalement.findByPk(req.params.id);

    if (!signalement) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    const updateData = { statut, synced: false };
    
    if (avancement_pourcentage !== undefined) {
      updateData.avancement_pourcentage = avancement_pourcentage;
    }
    
    // Si terminé, mettre l'avancement à 100%
    if (statut === 'TERMINE') {
      updateData.avancement_pourcentage = 100;
      updateData.date_fin = new Date();
    }

    await signalement.update(updateData);

    res.json({ message: 'Statut modifié', signalement });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/signalements/{id}:
 *   delete:
 *     summary: Supprimer un signalement (manager uniquement)
 *     tags: [Signalements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Signalement supprimé
 *       404:
 *         description: Signalement non trouvé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const signalement = await Signalement.findByPk(req.params.id);

    if (!signalement) {
      return res.status(404).json({ message: 'Signalement non trouvé' });
    }

    await signalement.destroy();

    res.json({ message: 'Signalement supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
