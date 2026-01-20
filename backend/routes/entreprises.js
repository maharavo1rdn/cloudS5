import { Router } from 'express';
import EntrepriseService from '../services/entrepriseService.js';

const router = Router();

/**
 * @swagger
 * /api/entreprises:
 *   get:
 *     summary: Récupérer toutes les entreprises
 *     tags: [Entreprises]
 *     responses:
 *       200:
 *         description: Liste des entreprises
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Entreprise'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const entreprises = await EntrepriseService.getAllEntreprises();
    res.json({ success: true, data: entreprises });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/entreprises/{id}:
 *   get:
 *     summary: Récupérer une entreprise par ID
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Détails de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Entreprise'
 *       404:
 *         description: Entreprise non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
  try {
    const entreprise = await EntrepriseService.getEntrepriseById(req.params.id);
    res.json({ success: true, data: entreprise });
  } catch (error) {
    if (error.message.includes('non trouvée')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @swagger
 * /api/entreprises/route/{routeId}:
 *   get:
 *     summary: Récupérer l'entreprise responsable d'une route
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la route
 *     responses:
 *       200:
 *         description: Entreprise responsable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Entreprise'
 *       404:
 *         description: Aucune entreprise trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/route/:routeId', async (req, res) => {
  try {
    const entreprise = await EntrepriseService.getEntrepriseByRoute(req.params.routeId);
    res.json({ success: true, data: entreprise });
  } catch (error) {
    if (error.message.includes('Aucune entreprise')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @swagger
 * /api/entreprises:
 *   post:
 *     summary: Créer une nouvelle entreprise
 *     tags: [Entreprises]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Entreprise'
 *     responses:
 *       201:
 *         description: Entreprise créée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Entreprise'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req, res) => {
  try {
    const entreprise = await EntrepriseService.createEntreprise(req.body);
    res.status(201).json({ success: true, data: entreprise });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/entreprises/{id}:
 *   put:
 *     summary: Mettre à jour une entreprise
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Entreprise'
 *     responses:
 *       200:
 *         description: Entreprise mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Entreprise'
 *       404:
 *         description: Entreprise non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', async (req, res) => {
  try {
    const entreprise = await EntrepriseService.updateEntreprise(req.params.id, req.body);
    res.json({ success: true, data: entreprise });
  } catch (error) {
    if (error.message.includes('non trouvée')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @swagger
 * /api/entreprises/{id}:
 *   delete:
 *     summary: Supprimer une entreprise
 *     tags: [Entreprises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Entreprise supprimée
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
 *         description: Entreprise non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await EntrepriseService.deleteEntreprise(req.params.id);
    res.json({ success: true, message: 'Entreprise supprimée avec succès' });
  } catch (error) {
    if (error.message.includes('non trouvée')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

export default router;