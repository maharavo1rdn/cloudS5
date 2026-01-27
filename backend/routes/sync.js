import { Router } from 'express';
import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';
import Entreprise from '../models/Entreprise.js';
import Probleme from '../models/Probleme.js';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Définir les associations si pas déjà faites
if (!Route.associations.probleme) {
  Route.belongsTo(Probleme, { foreignKey: 'probleme_id', as: 'probleme' });
}
if (!Route.associations.entreprise) {
  Route.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
}
if (!Route.associations.points) {
  Route.hasMany(RoutePoint, { foreignKey: 'route_id', as: 'points' });
}

// Support pour la table 'points' ajoutée (utilisée dans les exports/imports ci‑dessous)

// Middleware pour vérifier le rôle manager (level >= 5)
const requireManager = (req, res, next) => {
  if (!req.user || req.user.level < 5) {
    return res.status(403).json({ message: 'Accès refusé. Rôle manager requis.' });
  }
  next();
};

/**
 * @swagger
 * /api/sync/status:
 *   get:
 *     summary: Vérifier le statut de synchronisation
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut de synchronisation
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.get('/status', authenticateToken, requireManager, async (req, res) => {
  try {
    // Approximation: nombre de "projets" = distinct probleme_id dans points
    const totalRoutes = await Point.count({ distinct: true, col: 'probleme_id' });
    const totalPoints = await Point.count();

    // Dernier point modifié
    const lastModified = await Point.findOne({
      order: [['created_at', 'DESC']],
      attributes: ['created_at'],
    });

    res.json({
      totalRoutes,
      totalPoints,
      lastModified: lastModified?.created_at || null,
      status: 'ready',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/sync/export:
 *   get:
 *     summary: Exporter toutes les routes pour synchronisation
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données exportées
 */
router.get('/export', authenticateToken, requireManager, async (req, res) => {
  try {
      // Exporter les points et référentiels
    const points = await Point.findAll({
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'email', 'telephone'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom', 'description'] },
        { model: PointStatut, as: 'statut', attributes: ['id', 'code', 'description'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const entreprises = await Entreprise.findAll();
    const problemes = await Probleme.findAll();

    res.json({
      exportDate: new Date().toISOString(),
      data: {
        points: points.map(p => p.toJSON()),
        entreprises: entreprises.map(e => e.toJSON()),
        problemes: problemes.map(p => p.toJSON()),
      },
      counts: {
        points: points.length,
        entreprises: entreprises.length,
        problemes: problemes.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/sync/firebase:
 *   post:
 *     summary: Synchroniser les données vers Firebase (stub)
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Synchronisation simulée réussie
 */
router.post('/firebase', authenticateToken, requireManager, async (req, res) => {
  try {
    const points = await Point.findAll({ include: [{ model: Probleme, as: 'probleme' }, { model: Entreprise, as: 'entreprise' }, { model: PointStatut, as: 'statut' }] });
    return res.json({ message: 'Synchronisation simulée', exported: points.length, data: points.map(p => p.toJSON()) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/sync/firebase/fetch:
 *   get:
 *     summary: Récupérer les données depuis Firebase (stub)
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Récupération simulée réussie
 */
router.get('/firebase/fetch', authenticateToken, requireManager, async (req, res) => {
  try {
    return res.json({ message: 'Récupération simulée', imported: 0, data: [] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/sync/import:
 *   post:
 *     summary: Importer des routes depuis une source externe
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routes:
 *                 type: array
 *     responses:
 *       200:
 *         description: Import réussi
 */
router.post('/import', authenticateToken, requireManager, async (req, res) => {
  try {
    const { points } = req.body;

    if (!points || !Array.isArray(points)) {
      return res.status(400).json({ message: 'Liste des points requise' });
    }

    const imported = [];
    const errors = [];

    for (const data of points) {
      try {
        // Créer le point
        const created = await Point.create({
          probleme_id: data.probleme_id,
          surface_m2: data.surface_m2,
          budget: data.budget,
          entreprise_id: data.entreprise_id,
          date_detection: data.date_detection || new Date(),
          date_debut: data.date_debut,
          date_fin: data.date_fin,
          avancement_pourcentage: data.avancement_pourcentage || 0,
          latitude: data.latitude,
          longitude: data.longitude,
          point_statut_id: data.point_statut_id || null,
        });

        imported.push(created.id);
      } catch (itemError) {
        errors.push({ data: data, error: itemError.message });
      }
    }

    res.json({
      message: 'Import terminé',
      imported: imported.length,
      errors: errors.length,
      details: { importedIds: imported, errors },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/sync/all:
 *   post:
 *     summary: Synchronisation complète
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Données de synchronisation
 */
router.post('/all', authenticateToken, requireManager, async (req, res) => {
  try {
    const points = await Point.findAll({
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom'] },
        { model: PointStatut, as: 'statut' },
      ],
    });

    res.json({
      message: 'Données prêtes pour synchronisation',
      exportDate: new Date().toISOString(),
      data: {
        count: points.length,
        points: points.map(p => ({
          id: p.id,
          probleme: p.probleme?.nom || null,
          entreprise: p.entreprise?.nom || null,
          surface_m2: parseFloat(p.surface_m2) || 0,
          budget: parseFloat(p.budget) || 0,
          avancement_pourcentage: p.avancement_pourcentage,
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          statut: p.statut?.code || null,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
