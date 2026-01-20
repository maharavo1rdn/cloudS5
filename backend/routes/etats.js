import { Router } from 'express';
import StatistiqueService from '../services/statistiqueService.js';

const router = Router();

/**
 * @swagger
 * /api/etat-routes:
 *   get:
 *     summary: Récupérer les états des routes
 *     tags: [Statistiques]
 *     responses:
 *       200:
 *         description: Statistiques par état
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
 *                     etats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           statut:
 *                             type: string
 *                           nombre_routes:
 *                             type: string
 *                           total_budget:
 *                             type: string
 *                           total_surface:
 *                             type: string
 *                           avancement_moyen:
 *                             type: string
 *                     totaux:
 *                       type: object
 *                       properties:
 *                         total_routes:
 *                           type: integer
 *                         total_budget:
 *                           type: number
 *                         total_surface:
 *                           type: number
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const etats = await StatistiqueService.getEtatsRoutes();
    res.json({ success: true, data: etats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;