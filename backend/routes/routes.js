import { Router } from 'express';
import RouteService from '../services/routeService.js';
import RoutePointService from '../services/routePointService.js';

const router = Router();

/**
 * @swagger
 * /api/routes/en-travaux:
 *   get:
 *     summary: Récupérer les routes en travaux
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: Liste des routes en travaux
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *       500:
 *         description: Erreur serveur
 */
router.get('/en-travaux', async (req, res) => {
  try {
    const routes = await RouteService.getRoutesEnTravaux();
    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{routeId}/points:
 *   get:
 *     summary: Récupérer tous les points d'une route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *     responses:
 *       200:
 *         description: Liste des points de la route
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoutePoint'
 *       500:
 *         description: Erreur serveur
 */
router.get('/:routeId/points', async (req, res) => {
  try {
    const points = await RoutePointService.getPointsByRoute(req.params.routeId);
    res.json({ success: true, count: points.length, data: points });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{routeId}/points/etat/{etatId}:
 *   get:
 *     summary: Récupérer les points par état
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *       - in: path
 *         name: etatId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [non_finis, finis]
 *         description: État des points (non_finis ou finis)
 *     responses:
 *       200:
 *         description: Liste des points filtrés par état
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 etat:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RoutePoint'
 *       400:
 *         description: État invalide
 *       500:
 *         description: Erreur serveur
 */
router.get('/:routeId/points/etat/:etatId', async (req, res) => {
  try {
    const points = await RoutePointService.getPointsByRouteAndEtat(
      req.params.routeId,
      req.params.etatId
    );
    res.json({
      success: true,
      etat: req.params.etatId,
      count: points.length,
      data: points
    });
  } catch (error) {
    if (error.message.includes("État invalide")) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Récupérer toutes les routes
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: Liste de toutes les routes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Route'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const routes = await RouteService.getAllRoutes();
    res.json({ success: true, count: routes.length, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Récupérer une route par ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *     responses:
 *       200:
 *         description: Détails de la route
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
  try {
    const route = await RouteService.getRouteById(req.params.id);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route non trouvée' });
    }
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Créer une nouvelle route
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Route'
 *     responses:
 *       201:
 *         description: Route créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req, res) => {
  try {
    const route = await RouteService.createRoute(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Mettre à jour une route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Route'
 *     responses:
 *       200:
 *         description: Route mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', async (req, res) => {
  try {
    const route = await RouteService.updateRoute(req.params.id, req.body);
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route non trouvée' });
    }
    res.json({ success: true, data: route });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Supprimer une route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *     responses:
 *       200:
 *         description: Route supprimée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Route non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await RouteService.deleteRoute(req.params.id);
    res.json({ success: true, message: 'Route supprimée avec succès' });
  } catch (error) {
    if (error.message.includes('non trouvée')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

export default router;