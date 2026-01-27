import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';

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
      // Nombre total de "projets" (approximé par le nombre distinct de problèmes)
    const totalRoutes = await Point.count({ distinct: true, col: 'probleme_id' });

    // Nombre total de points GPS
    const totalPoints = await Point.count();

    // Totaux agrégés (depuis la table points)
    const totaux = await Point.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
        [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
        [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
      ],
      raw: true,
    });

    // Comptage par statut (via point_statut)
    const pointsParStatut = await Point.findAll({
      attributes: [
        'point_statut_id',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['point_statut_id'],
      raw: true,
    });

    const parStatut = {};
    for (const item of pointsParStatut) {
      const statut = item.point_statut_id ? await PointStatut.findByPk(item.point_statut_id) : null;
      const key = statut ? statut.code.toLowerCase() : 'inconnu';
      parStatut[key] = parseInt(item.count, 10);
    }

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
    // Statistiques générales basées sur la table points
    const totalRoutes = await Point.count({ distinct: true, col: 'probleme_id' });
    const totalPoints = await Point.count();

    const totaux = await Point.findOne({
      attributes: [
        [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
        [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
        [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
      ],
      raw: true,
    });

    // Comptage par statut (point_statut_id)
    const pointsParStatut = await Point.findAll({
      attributes: [
        'point_statut_id',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['point_statut_id'],
      raw: true,
    });

    const pointsStatut = {};
    for (const item of pointsParStatut) {
      const statut = item.point_statut_id ? await PointStatut.findByPk(item.point_statut_id) : null;
      const key = statut ? statut.code.toLowerCase() : 'inconnu';
      pointsStatut[key] = parseInt(item.count, 10);
    }

    // Derniers points ajoutés
    const dernieresPoints = await Point.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [{ model: Probleme, as: 'probleme', attributes: ['nom'] }, { model: Entreprise, as: 'entreprise', attributes: ['nom'] }],
      attributes: ['id', 'surface_m2', 'budget', 'avancement_pourcentage', 'created_at'],
    });

    // Statistiques par type de problème (depuis points)
    const parProbleme = await Point.findAll({
      attributes: [
        'probleme_id',
        [fn('COUNT', col('Point.id')), 'count'],
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

    // Statistiques par entreprise (depuis points)
    const parEntreprise = await Point.findAll({
      attributes: [
        'entreprise_id',
        [fn('COUNT', col('Point.id')), 'count'],
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

    res.json({
      resume: {
        totalRoutes,
        totalPoints,
        totalSurface: parseFloat(totaux.totalSurface) || 0,
        totalBudget: parseFloat(totaux.totalBudget) || 0,
        avancementMoyen: Math.round(parseFloat(totaux.avancementMoyen) || 0),
      },
      parStatut: pointsStatut,
      pointsStatut,
      dernieresRoutes: dernieresPoints,
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
