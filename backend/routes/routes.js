import { Router } from 'express';
import RouteService from '../services/routeService.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/routes/enTravaux:
 *   get:
 *     summary: Lister les points/routes en travaux
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des points en travaux
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   probleme:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nom:
 *                         type: string
 *                       description:
 *                         type: string
 *                   surface_m2:
 *                     type: number
 *                   budget:
 *                     type: number
 *                   avancement_pourcentage:
 *                     type: integer
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/enTravaux', async (req, res) => {
  try {
    const routesEnTravaux = await RouteService.getRoutesEnTravaux();
    res.json(routesEnTravaux);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routes/points/statut/{statutId}/nonFinis:
 *   get:
 *     summary: Récupérer les points non finis (encore en travaux) d'un statut
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statutId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du statut
 *     responses:
 *       200:
 *         description: Points non finis du statut spécifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statut:
 *                   type: string
 *                 description:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 points:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Statut non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/points/statut/:statutId/nonFinis', async (req, res) => {
  try {
    const { statutId } = req.params;
    const points = await RouteService.getPointsNonFinisParStatut(parseInt(statutId));
    res.json(points);
  } catch (error) {
    if (error.message.includes('non trouvé')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }
});

/**
 * @swagger
 * /api/routes/points/statut/{statutId}/finis:
 *   get:
 *     summary: Récupérer les points finis (terminés) d'un statut
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: statutId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du statut
 *     responses:
 *       200:
 *         description: Points finis du statut spécifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statut:
 *                   type: string
 *                 description:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 points:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Statut non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/points/statut/:statutId/finis', async (req, res) => {
  try {
    const { statutId } = req.params;
    const points = await RouteService.getPointsFinisParStatut(parseInt(statutId));
    res.json(points);
  } catch (error) {
    if (error.message.includes('non trouvé')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }
});

/**
 * @swagger
 * /api/routes/statuts:
 *   get:
 *     summary: Lister tous les statuts des points/routes
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des statuts avec nombre de points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   description:
 *                     type: string
 *                   niveau:
 *                     type: integer
 *                   nombre_points:
 *                     type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/statuts',  async (req, res) => {
  try {
    const statuts = await RouteService.getAllStatutsRoutes();
    res.json(statuts);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routes/problemes:
 *   get:
 *     summary: Récupérer la liste des problèmes routiers
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des problèmes avec nombre de points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nom:
 *                     type: string
 *                   description:
 *                     type: string
 *                   nombre_points:
 *                     type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/problemes', async (req, res) => {
  try {
    const problemes = await RouteService.getProblemesRoutiers();
    res.json(problemes);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routes/{pointId}/entreprise:
 *   get:
 *     summary: Récupérer les données de l'entreprise qui fait les travaux sur un point
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du point
 *     responses:
 *       200:
 *         description: Informations de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 point_id:
 *                   type: integer
 *                 probleme:
 *                   type: string
 *                 date_detection:
 *                   type: string
 *                   format: date-time
 *                 entreprise:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nom:
 *                       type: string
 *                     email:
 *                       type: string
 *                     telephone:
 *                       type: string
 *       404:
 *         description: Point ou entreprise non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:pointId/entreprise', async (req, res) => {
  try {
    const { pointId } = req.params;
    const entreprise = await RouteService.getEntreprisePourPoint(parseInt(pointId));
    res.json(entreprise);
  } catch (error) {
    if (error.message.includes('non trouvé') || error.message.includes('Aucune entreprise')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }
});

/**
 * @swagger
 * /api/routes/recapitulatif:
 *   get:
 *     summary: Données pour le tableau récapitulatif
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tableau récapitulatif complet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resume_general:
 *                   type: object
 *                   properties:
 *                     total_points:
 *                       type: integer
 *                     total_surface_m2:
 *                       type: number
 *                     total_budget:
 *                       type: number
 *                     moyenne_avancement:
 *                       type: number
 *                 par_statut:
 *                   type: array
 *                   items:
 *                     type: object
 *                 points_recents:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Erreur serveur
 */
router.get('/recapitulatif', async (req, res) => {
  try {
    const recapitulatif = await RouteService.getTableauRecapitulatif();
    res.json(recapitulatif);
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /api/routes/point/{pointId}/details:
 *   get:
 *     summary: Récupérer les détails d'un point pour le survol
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du point
 *     responses:
 *       200:
 *         description: Détails complets du point
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 probleme:
 *                   type: object
 *                 date_detection:
 *                   type: string
 *                 statut:
 *                   type: object
 *                 surface_m2:
 *                   type: number
 *                 budget:
 *                   type: number
 *                 entreprise:
 *                   type: object
 *                 avancement_pourcentage:
 *                   type: integer
 *                 latitude:
 *                   type: number
 *                 longitude:
 *                   type: number
 *       404:
 *         description: Point non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/point/:pointId/details', async (req, res) => {
  try {
    const { pointId } = req.params;
    const details = await RouteService.getDetailsPoint(parseInt(pointId));
    res.json(details);
  } catch (error) {
    if (error.message.includes('non trouvé')) {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: 'Erreur serveur', 
        error: error.message 
      });
    }
  }
});

export default router;