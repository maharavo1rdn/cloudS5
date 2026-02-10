import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import sequelize from '../config/database.js';
import authenticateToken from '../middleware/auth.js';
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

/**
 * @swagger
 * /api/stats/processing-times:
 *   get:
 *     summary: Récupérer les statistiques de délai de traitement des travaux
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des délais de traitement
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageProcessingDays:
 *                   type: number
 *                   description: Délai moyen de traitement en jours
 *                 averageProcessingDaysTermines:
 *                   type: number
 *                   description: Délai moyen pour les travaux terminés en jours
 *                 averageProcessingDaysEnCours:
 *                   type: number
 *                   description: Délai moyen depuis le début pour les travaux en cours en jours
 *                 totalTermines:
 *                   type: integer
 *                   description: Nombre total de travaux terminés
 *                 totalEnCours:
 *                   type: integer
 *                   description: Nombre total de travaux en cours
 *                 parProbleme:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       probleme:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       averageDays:
 *                         type: number
 *                 parEntreprise:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       entreprise:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       averageDays:
 *                         type: number
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get('/processing-times', authenticateToken, async (req, res) => {
  try {
    // Récupérer les ID de statuts
    const termineStat = await PointStatut.findOne({ where: { code: 'TERMINE' } });
    const enCoursStat = await PointStatut.findOne({ where: { code: 'EN_COURS' } });

    if (!termineStat || !enCoursStat) {
      return res.status(400).json({ message: 'Statuts non trouvés dans la base de données' });
    }

    // Points terminés avec date_debut et date_fin
    const pointsTermines = await Point.findAll({
      attributes: [
        'id',
        'date_debut',
        'date_fin',
        'probleme_id',
        'entreprise_id',
      ],
      where: {
        point_statut_id: termineStat.id,
        date_debut: { [Op.not]: null },
        date_fin: { [Op.not]: null },
      },
      include: [
        { model: Probleme, as: 'probleme', attributes: ['nom'] },
        { model: Entreprise, as: 'entreprise', attributes: ['nom'] }
      ],
      raw: false,
    });

    // Points en cours avec date_debut
    const pointsEnCours = await Point.findAll({
      attributes: [
        'id',
        'date_debut',
        'probleme_id',
        'entreprise_id',
      ],
      where: {
        point_statut_id: enCoursStat.id,
        date_debut: { [Op.not]: null },
      },
      include: [
        { model: Probleme, as: 'probleme', attributes: ['nom'] },
        { model: Entreprise, as: 'entreprise', attributes: ['nom'] }
      ],
      raw: false,
    });

    // Calculer les délais
    const calculateDaysDifference = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    };

    // Délai moyen pour les terminés
    let averageProcessingDaysTermines = 0;
    if (pointsTermines.length > 0) {
      const daysTermines = pointsTermines.map(p => 
        calculateDaysDifference(p.date_debut, p.date_fin)
      );
      averageProcessingDaysTermines = Math.round(
        daysTermines.reduce((a, b) => a + b, 0) / daysTermines.length
      );
    }

    // Délai moyen pour les en cours
    let averageProcessingDaysEnCours = 0;
    if (pointsEnCours.length > 0) {
      const daysEnCours = pointsEnCours.map(p => 
        calculateDaysDifference(p.date_debut, new Date())
      );
      averageProcessingDaysEnCours = Math.round(
        daysEnCours.reduce((a, b) => a + b, 0) / daysEnCours.length
      );
    }

    // Délai moyen global
    const allPointsWithDates = [
      ...pointsTermines.map(p => ({
        ...p,
        days: calculateDaysDifference(p.date_debut, p.date_fin)
      })),
      ...pointsEnCours.map(p => ({
        ...p,
        days: calculateDaysDifference(p.date_debut, new Date())
      }))
    ];

    let averageProcessingDays = 0;
    if (allPointsWithDates.length > 0) {
      averageProcessingDays = Math.round(
        allPointsWithDates.reduce((sum, p) => sum + p.days, 0) / allPointsWithDates.length
      );
    }

    // Statistiques par problème
    const parProbleme = {};
    allPointsWithDates.forEach(point => {
      const problemeNom = point.probleme?.nom || 'Non défini';
      if (!parProbleme[problemeNom]) {
        parProbleme[problemeNom] = { count: 0, totalDays: 0 };
      }
      parProbleme[problemeNom].count += 1;
      parProbleme[problemeNom].totalDays += point.days;
    });

    const parProblemeFormatted = Object.entries(parProbleme).map(([probleme, data]) => ({
      probleme,
      count: data.count,
      averageDays: Math.round(data.totalDays / data.count),
    }));

    // Statistiques par entreprise
    const parEntreprise = {};
    allPointsWithDates.forEach(point => {
      const entrepriseNom = point.entreprise?.nom || 'Non assignée';
      if (!parEntreprise[entrepriseNom]) {
        parEntreprise[entrepriseNom] = { count: 0, totalDays: 0 };
      }
      parEntreprise[entrepriseNom].count += 1;
      parEntreprise[entrepriseNom].totalDays += point.days;
    });

    const parEntrepriseFormatted = Object.entries(parEntreprise).map(([entreprise, data]) => ({
      entreprise,
      count: data.count,
      averageDays: Math.round(data.totalDays / data.count),
    }));

    res.json({
      averageProcessingDays,
      averageProcessingDaysTermines,
      averageProcessingDaysEnCours,
      totalTermines: pointsTermines.length,
      totalEnCours: pointsEnCours.length,
      parProbleme: parProblemeFormatted.sort((a, b) => b.averageDays - a.averageDays),
      parEntreprise: parEntrepriseFormatted.sort((a, b) => b.averageDays - a.averageDays),
    });
  } catch (error) {
    console.error('Error calculating processing times:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
