import { Router } from 'express';
import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';
import Entreprise from '../models/Entreprise.js';
import Probleme from '../models/Probleme.js';
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
    const totalRoutes = await Route.count();
    const totalPoints = await RoutePoint.count();

    // Dernière route modifiée
    const lastModified = await Route.findOne({
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
    const routes = await Route.findAll({
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'email', 'telephone'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom', 'description'] },
        { model: RoutePoint, as: 'points', attributes: ['id', 'latitude', 'longitude', 'ordre', 'point_statut'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const entreprises = await Entreprise.findAll();
    const problemes = await Probleme.findAll();

    res.json({
      exportDate: new Date().toISOString(),
      data: {
        routes: routes.map(r => r.toJSON()),
        entreprises: entreprises.map(e => e.toJSON()),
        problemes: problemes.map(p => p.toJSON()),
      },
      counts: {
        routes: routes.length,
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
    const { routes } = req.body;

    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ message: 'Liste des routes requise' });
    }

    const imported = [];
    const errors = [];

    for (const data of routes) {
      try {
        // Créer la route
        const route = await Route.create({
          nom: data.nom,
          description: data.description,
          probleme_id: data.probleme_id,
          entreprise_id: data.entreprise_id,
          statut: data.statut || 'NOUVEAU',
          surface_m2: data.surface_m2,
          budget: data.budget,
          date_detection: data.date_detection || new Date(),
          date_debut: data.date_debut,
          date_fin: data.date_fin,
          avancement_pourcentage: data.avancement_pourcentage || 0,
        });

        // Créer les points si fournis
        if (data.points && Array.isArray(data.points)) {
          for (let i = 0; i < data.points.length; i++) {
            const point = data.points[i];
            await RoutePoint.create({
              route_id: route.id,
              latitude: point.latitude,
              longitude: point.longitude,
              ordre: point.ordre || i + 1,
              point_statut: point.point_statut || 'A_TRAITER',
            });
          }
        }

        imported.push(route.id);
      } catch (itemError) {
        errors.push({ data: data.nom, error: itemError.message });
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
    const routes = await Route.findAll({
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom'] },
        { model: RoutePoint, as: 'points' },
      ],
    });

    res.json({
      message: 'Données prêtes pour synchronisation',
      exportDate: new Date().toISOString(),
      data: {
        count: routes.length,
        routes: routes.map(r => ({
          id: r.id,
          nom: r.nom,
          description: r.description,
          statut: r.statut,
          surface_m2: parseFloat(r.surface_m2) || 0,
          budget: parseFloat(r.budget) || 0,
          avancement_pourcentage: r.avancement_pourcentage,
          entreprise: r.entreprise?.nom || null,
          probleme: r.probleme?.nom || null,
          points: r.points?.map(p => ({
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            ordre: p.ordre,
            statut: p.point_statut,
          })) || [],
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
