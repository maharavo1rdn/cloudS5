import { Router } from 'express';
import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';
import Entreprise from '../models/Entreprise.js';
import Probleme from '../models/Probleme.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Définir les associations
Route.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
Route.belongsTo(Probleme, { foreignKey: 'probleme_id', as: 'probleme' });
Route.hasMany(RoutePoint, { foreignKey: 'route_id', as: 'points' });
RoutePoint.belongsTo(Route, { foreignKey: 'route_id', as: 'route' });

// Middleware pour vérifier le rôle manager (level >= 5)
const requireManager = (req, res, next) => {
  if (!req.user || req.user.level < 5) {
    return res.status(403).json({ message: 'Accès refusé. Rôle manager requis.' });
  }
  next();
};

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Récupérer tous les travaux routiers
 *     tags: [Routes]
 *     parameters:
 *       - in: query
 *         name: statut
 *         schema:
 *           type: string
 *           enum: [NOUVEAU, EN_COURS, TERMINE]
 *         description: Filtrer par statut
 *       - in: query
 *         name: probleme_id
 *         schema:
 *           type: integer
 *         description: Filtrer par type de problème
 *       - in: query
 *         name: entreprise_id
 *         schema:
 *           type: integer
 *         description: Filtrer par entreprise
 *     responses:
 *       200:
 *         description: Liste des routes
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const { statut, probleme_id, entreprise_id } = req.query;
    const where = {};
    
    if (statut) where.statut = statut;
    if (probleme_id) where.probleme_id = probleme_id;
    if (entreprise_id) where.entreprise_id = entreprise_id;

    const routes = await Route.findAll({
      where,
      include: [
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'telephone', 'email'] },
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom', 'description'] },
        { model: RoutePoint, as: 'points', attributes: ['id', 'latitude', 'longitude', 'ordre', 'point_statut'] }
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
 *     responses:
 *       200:
 *         description: Route trouvée
 *       404:
 *         description: Route non trouvée
 */
router.get('/:id', async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id, {
      include: [
        { model: Entreprise, as: 'entreprise' },
        { model: Probleme, as: 'probleme' },
        { model: RoutePoint, as: 'points', order: [['ordre', 'ASC']] }
      ],
    });

    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Créer une nouvelle route (Manager uniquement)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *             properties:
 *               nom:
 *                 type: string
 *               description:
 *                 type: string
 *               probleme_id:
 *                 type: integer
 *               entreprise_id:
 *                 type: integer
 *               surface_m2:
 *                 type: number
 *               budget:
 *                 type: number
 *               points:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *     responses:
 *       201:
 *         description: Route créée
 *       403:
 *         description: Accès refusé
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { nom, description, probleme_id, entreprise_id, surface_m2, budget, date_debut, points } = req.body;

    // Créer la route
    const route = await Route.create({
      nom,
      description,
      probleme_id,
      entreprise_id,
      surface_m2,
      budget,
      date_detection: new Date(),
      date_debut,
      statut: 'NOUVEAU',
      avancement_pourcentage: 0
    });

    // Créer les points si fournis
    if (points && Array.isArray(points) && points.length > 0) {
      const routePoints = points.map((point, index) => ({
        route_id: route.id,
        latitude: point.latitude,
        longitude: point.longitude,
        ordre: index + 1,
        point_statut: 'A_TRAITER'
      }));
      await RoutePoint.bulkCreate(routePoints);
    }

    // Récupérer la route avec ses relations
    const routeWithRelations = await Route.findByPk(route.id, {
      include: [
        { model: Entreprise, as: 'entreprise' },
        { model: Probleme, as: 'probleme' },
        { model: RoutePoint, as: 'points' }
      ],
    });

    res.status(201).json(routeWithRelations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Mettre à jour une route (Manager uniquement)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route mise à jour
 *       404:
 *         description: Route non trouvée
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    const { nom, description, probleme_id, entreprise_id, statut, surface_m2, budget, date_debut, date_fin, avancement_pourcentage, points } = req.body;

    // Mettre à jour la route
    await route.update({
      nom: nom !== undefined ? nom : route.nom,
      description: description !== undefined ? description : route.description,
      probleme_id: probleme_id !== undefined ? probleme_id : route.probleme_id,
      entreprise_id: entreprise_id !== undefined ? entreprise_id : route.entreprise_id,
      statut: statut !== undefined ? statut : route.statut,
      surface_m2: surface_m2 !== undefined ? surface_m2 : route.surface_m2,
      budget: budget !== undefined ? budget : route.budget,
      date_debut: date_debut !== undefined ? date_debut : route.date_debut,
      date_fin: date_fin !== undefined ? date_fin : route.date_fin,
      avancement_pourcentage: avancement_pourcentage !== undefined ? avancement_pourcentage : route.avancement_pourcentage,
    });

    // Mettre à jour les points si fournis
    if (points && Array.isArray(points)) {
      // Supprimer les anciens points
      await RoutePoint.destroy({ where: { route_id: route.id } });
      
      // Créer les nouveaux points
      if (points.length > 0) {
        const routePoints = points.map((point, index) => ({
          route_id: route.id,
          latitude: point.latitude,
          longitude: point.longitude,
          ordre: point.ordre || index + 1,
          point_statut: point.point_statut || 'A_TRAITER'
        }));
        await RoutePoint.bulkCreate(routePoints);
      }
    }

    // Récupérer la route mise à jour avec ses relations
    const updatedRoute = await Route.findByPk(route.id, {
      include: [
        { model: Entreprise, as: 'entreprise' },
        { model: Probleme, as: 'probleme' },
        { model: RoutePoint, as: 'points' }
      ],
    });

    res.json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}/avancement:
 *   patch:
 *     summary: Mettre à jour l'avancement d'une route (Manager uniquement)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avancement_pourcentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Avancement mis à jour
 */
router.patch('/:id/avancement', authenticateToken, requireManager, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    const { avancement_pourcentage } = req.body;

    // Valider l'avancement
    if (avancement_pourcentage < 0 || avancement_pourcentage > 100) {
      return res.status(400).json({ message: 'Avancement doit être entre 0 et 100' });
    }

    // Mettre à jour l'avancement et le statut si nécessaire
    let statut = route.statut;
    if (avancement_pourcentage === 100) {
      statut = 'TERMINE';
    } else if (avancement_pourcentage > 0) {
      statut = 'EN_COURS';
    }

    await route.update({ avancement_pourcentage, statut });

    res.json(route);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Supprimer une route (Manager uniquement)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route supprimée
 *       404:
 *         description: Route non trouvée
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route non trouvée' });
    }

    // Supprimer d'abord les points associés
    await RoutePoint.destroy({ where: { route_id: route.id } });
    
    // Supprimer la route
    await route.destroy();

    res.json({ message: 'Route supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}/points:
 *   get:
 *     summary: Récupérer les points GPS d'une route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des points
 */
router.get('/:id/points', async (req, res) => {
  try {
    const points = await RoutePoint.findAll({
      where: { route_id: req.params.id },
      order: [['ordre', 'ASC']]
    });

    res.json(points);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/routes/{id}/points/{pointId}:
 *   patch:
 *     summary: Mettre à jour le statut d'un point (Manager uniquement)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: pointId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               point_statut:
 *                 type: string
 *                 enum: [A_TRAITER, EN_COURS, FINI]
 *     responses:
 *       200:
 *         description: Point mis à jour
 */
router.patch('/:id/points/:pointId', authenticateToken, requireManager, async (req, res) => {
  try {
    const point = await RoutePoint.findOne({
      where: { id: req.params.pointId, route_id: req.params.id }
    });
    
    if (!point) {
      return res.status(404).json({ message: 'Point non trouvé' });
    }

    const { point_statut } = req.body;

    if (!['A_TRAITER', 'EN_COURS', 'FINI'].includes(point_statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    await point.update({ point_statut });

    res.json(point);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
