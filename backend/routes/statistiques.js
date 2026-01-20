import { Router } from 'express';
import StatistiqueService from '../services/statistiqueService.js';

const router = Router();

/**
 * @swagger
 * /api/statistiques/tableau-recap:
 *   get:
 *     summary: Récupérer le tableau récapitulatif
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Tableau récapitulatif
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     statistiques:
 *                       type: object
 *                       properties:
 *                         total_routes:
 *                           type: integer
 *                         total_points:
 *                           type: integer
 *                         total_surface_m2:
 *                           type: number
 *                         total_budget:
 *                           type: number
 *                         avancement_global_pourcentage:
 *                           type: number
 *                         pourcentage_points_finis:
 *                           type: number
 *                         pourcentage_routes_terminees:
 *                           type: number
 *                         points_finis:
 *                           type: integer
 *                         points_en_cours:
 *                           type: integer
 *                         points_a_traiter:
 *                           type: integer
 *                         routes_nouvelles:
 *                           type: integer
 *                         routes_en_cours:
 *                           type: integer
 *                         routes_terminees:
 *                           type: integer
 *                     routes_en_cours:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           nom:
 *                             type: string
 *                           statut:
 *                             type: string
 *                           surface_m2:
 *                             type: number
 *                           budget:
 *                             type: number
 *                           avancement_pourcentage:
 *                             type: integer
 *                           entreprise_nom:
 *                             type: string
 *                           probleme_nom:
 *                             type: string
 *                           points_finis:
 *                             type: string
 *                           points_restants:
 *                             type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Erreur serveur
 */
router.get('/tableau-recap', async (req, res) => {
  try {
    const tableau = await StatistiqueService.getTableauRecapitulatif();
    res.json({
      success: true,
      data: tableau,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;