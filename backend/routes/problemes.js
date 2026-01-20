import { Router } from 'express';
import ProblemeService from '../services/problemeService.js';

const router = Router();

/**
 * @swagger
 * /api/problemes:
 *   get:
 *     summary: Récupérer tous les problèmes routiers
 *     tags: [Problèmes]
 *     responses:
 *       200:
 *         description: Liste des problèmes
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
 *                     $ref: '#/components/schemas/Probleme'
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const problemes = await ProblemeService.getAllProblemes();
    res.json({ success: true, data: problemes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/problemes/{id}:
 *   get:
 *     summary: Récupérer un problème par ID
 *     tags: [Problèmes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du problème
 *     responses:
 *       200:
 *         description: Détails du problème
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Probleme'
 *       404:
 *         description: Problème non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
  try {
    const probleme = await ProblemeService.getProblemeById(req.params.id);
    res.json({ success: true, data: probleme });
  } catch (error) {
    if (error.message.includes('non trouvé')) {
      res.status(404).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

/**
 * @swagger
 * /api/problemes:
 *   post:
 *     summary: Créer un nouveau problème
 *     tags: [Problèmes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Probleme'
 *     responses:
 *       201:
 *         description: Problème créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Probleme'
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */
router.post('/', async (req, res) => {
  try {
    const probleme = await ProblemeService.createProbleme(req.body);
    res.status(201).json({ success: true, data: probleme });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;