import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';

const router = Router();

// Définir les associations si pas déjà faites
if (!Route.associations.probleme) {
  Route.belongsTo(Probleme, { foreignKey: 'probleme_id', as: 'probleme' });
}
if (!Route.associations.entreprise) {
  Route.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
}

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Récupérer les statistiques globales des travaux routiers
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Statistiques des routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRoutes:
 *                   type: integer
 *                   description: Nombre total de routes
 *                 totalPoints:
 *                   type: integer
 *                   description: Nombre total de points GPS
 *                 totalSurface:
 *                   type: number
 *                   description: Surface totale en m²
 *                 totalBudget:
 *                   type: number
 *                   description: Budget total en Ariary
 *                 avancementMoyen:
 *                   type: number
 *                   description: Avancement moyen en pourcentage
 *                 parStatut:
 *                   type: object
 *                   properties:
 *                     nouveau:
 *                       type: integer
 *                     en_cours:
 *                       type: integer
 *                     termine:
 *                       type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    // Nombre total de routes
    const totalRoutes = await Route.count();

    // Nombre total de points GPS
    const totalPoints = await RoutePoint.count();

    // Totaux agrégés
    const totaux = await Route.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
        [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
        [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
      ],
      raw: true,
    });

    // Comptage par statut
    const statutCounts = await Route.findAll({
      attributes: [
        'statut',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['statut'],
      raw: true,
    });

    // Formater les comptages par statut
    const parStatut = {
      nouveau: 0,
      en_cours: 0,
      termine: 0,
    };

    statutCounts.forEach((item) => {
      const key = item.statut.toLowerCase();
      parStatut[key] = parseInt(item.count, 10);
    });

    res.json({
      totalRoutes,
      totalPoints,
      totalSurface: parseFloat(totaux.totalSurface) || 0,
      totalBudget: parseFloat(totaux.totalBudget) || 0,
      avancementMoyen: Math.round(parseFloat(totaux.avancementMoyen) || 0),
      parStatut,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/stats/dashboard:
 *   get:
 *     summary: Récupérer les données du tableau de bord
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Données du tableau de bord
 *       500:
 *         description: Erreur serveur
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Statistiques générales
    const totalRoutes = await Route.count();
    const totalPoints = await RoutePoint.count();

    const totaux = await Route.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
        [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
        [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
      ],
      raw: true,
    });

    // Comptage par statut
    const statutCounts = await Route.findAll({
      attributes: [
        'statut',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['statut'],
      raw: true,
    });

    const parStatut = { nouveau: 0, en_cours: 0, termine: 0 };
    statutCounts.forEach((item) => {
      const key = item.statut.toLowerCase();
      parStatut[key] = parseInt(item.count, 10);
    });

    // Dernières routes ajoutées
    const dernieresRoutes = await Route.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'nom', 'statut', 'surface_m2', 'budget', 'avancement_pourcentage', 'created_at'],
    });

    // Statistiques par type de problème
    const parProbleme = await Route.findAll({
      attributes: [
        'probleme_id',
        [fn('COUNT', col('Route.id')), 'count'],
        [fn('SUM', col('budget')), 'totalBudget'],
      ],
      include: [{
        model: Probleme,
        as: 'probleme',
        attributes: ['nom'],
      }],
      group: ['probleme_id', 'probleme.id', 'probleme.nom'],
      raw: true,
      nest: true,
    });

    // Statistiques par entreprise
    const parEntreprise = await Route.findAll({
      attributes: [
        'entreprise_id',
        [fn('COUNT', col('Route.id')), 'count'],
        [fn('SUM', col('budget')), 'totalBudget'],
      ],
      where: { entreprise_id: { [Op.not]: null } },
      include: [{
        model: Entreprise,
        as: 'entreprise',
        attributes: ['nom'],
      }],
      group: ['entreprise_id', 'entreprise.id', 'entreprise.nom'],
      raw: true,
      nest: true,
    });

    // Statistiques des points par statut
    const pointsParStatut = await RoutePoint.findAll({
      attributes: [
        'point_statut',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['point_statut'],
      raw: true,
    });

    const pointsStatut = { a_traiter: 0, en_cours: 0, fini: 0 };
    pointsParStatut.forEach((item) => {
      const key = item.point_statut.toLowerCase();
      pointsStatut[key] = parseInt(item.count, 10);
    });

    res.json({
      resume: {
        totalRoutes,
        totalPoints,
        totalSurface: parseFloat(totaux.totalSurface) || 0,
        totalBudget: parseFloat(totaux.totalBudget) || 0,
        avancementMoyen: Math.round(parseFloat(totaux.avancementMoyen) || 0),
      },
      parStatut,
      pointsStatut,
      dernieresRoutes,
      parProbleme: parProbleme.map(p => ({
        probleme: p.probleme?.nom || 'Non défini',
        count: parseInt(p.count, 10),
        budget: parseFloat(p.totalBudget) || 0,
      })),
      parEntreprise: parEntreprise.map(e => ({
        entreprise: e.entreprise?.nom || 'Non assignée',
        count: parseInt(e.count, 10),
        budget: parseFloat(e.totalBudget) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
