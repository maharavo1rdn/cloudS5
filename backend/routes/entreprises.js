import { Router } from 'express';
import Entreprise from '../models/Entreprise.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Middleware pour vérifier le rôle manager (level >= 5)
const requireManager = (req, res, next) => {
  if (!req.user || req.user.level < 5) {
    return res.status(403).json({ message: 'Accès refusé. Rôle manager requis.' });
  }
  next();
};

/**
 * @swagger
 * /api/entreprises:
 *   get:
 *     summary: Récupérer toutes les entreprises
 *     tags: [Entreprises]
 *     responses:
 *       200:
 *         description: Liste des entreprises
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const entreprises = await Entreprise.findAll({
      order: [['nom', 'ASC']],
    });
    res.json(entreprises);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
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
 *     responses:
 *       200:
 *         description: Entreprise trouvée
 *       404:
 *         description: Entreprise non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id);

    if (!entreprise) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }

    res.json(entreprise);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/entreprises:
 *   post:
 *     summary: Créer une nouvelle entreprise (manager uniquement)
 *     tags: [Entreprises]
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
 *               email:
 *                 type: string
 *               telephone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entreprise créée
 *       400:
 *         description: Nom requis
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { nom, email, telephone } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le nom est requis' });
    }

    const entreprise = await Entreprise.create({ nom, email, telephone });

    res.status(201).json({ message: 'Entreprise créée', entreprise });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/entreprises/{id}:
 *   put:
 *     summary: Modifier une entreprise (manager uniquement)
 *     tags: [Entreprises]
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
 *               nom:
 *                 type: string
 *               email:
 *                 type: string
 *               telephone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entreprise modifiée
 *       404:
 *         description: Entreprise non trouvée
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id);

    if (!entreprise) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }

    const { nom, email, telephone } = req.body;

    await entreprise.update({
      nom: nom ?? entreprise.nom,
      email: email ?? entreprise.email,
      telephone: telephone ?? entreprise.telephone,
    });

    res.json({ message: 'Entreprise modifiée', entreprise });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/entreprises/{id}:
 *   delete:
 *     summary: Supprimer une entreprise (manager uniquement)
 *     tags: [Entreprises]
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
 *         description: Entreprise supprimée
 *       404:
 *         description: Entreprise non trouvée
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const entreprise = await Entreprise.findByPk(req.params.id);

    if (!entreprise) {
      return res.status(404).json({ message: 'Entreprise non trouvée' });
    }

    await entreprise.destroy();

    res.json({ message: 'Entreprise supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
