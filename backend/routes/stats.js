import { Router } from 'express';
import authenticateToken from '../middleware/auth.js';
import StatsService from '../services/statsService.js';

const router = Router();

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
    const stats = await StatsService.getGeneralStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching general stats:', error);
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
    const stats = await StatsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
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
    const stats = await StatsService.getProcessingTimesStats();
    res.json(stats);
  } catch (error) {
    console.error('Error calculating processing times:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
