import { Router } from 'express';
import Probleme from '../models/Probleme.js';
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
 * /api/problemes:
 *   get:
 *     summary: Récupérer tous les types de problèmes
 *     tags: [Problemes]
 *     responses:
 *       200:
 *         description: Liste des problèmes
 *       500:
 *         description: Erreur serveur
 */
router.get('/', async (req, res) => {
  try {
    const problemes = await Probleme.findAll({
      order: [['nom', 'ASC']],
    });
    res.json(problemes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/problemes:
 *   post:
 *     summary: Créer un nouveau type de problème (manager uniquement)
 *     tags: [Problemes]
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
 *     responses:
 *       201:
 *         description: Problème créé
 *       400:
 *         description: Nom requis
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { nom, description } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le nom est requis' });
    }

    const probleme = await Probleme.create({ nom, description });

    res.status(201).json({ message: 'Problème créé', probleme });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/problemes/{id}:
 *   put:
 *     summary: Modifier un type de problème (manager uniquement)
 *     tags: [Problemes]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Problème modifié
 *       404:
 *         description: Problème non trouvé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const probleme = await Probleme.findByPk(req.params.id);

    if (!probleme) {
      return res.status(404).json({ message: 'Problème non trouvé' });
    }

    const { nom, description } = req.body;

    await probleme.update({
      nom: nom ?? probleme.nom,
      description: description ?? probleme.description,
    });

    res.json({ message: 'Problème modifié', probleme });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/problemes/{id}:
 *   delete:
 *     summary: Supprimer un type de problème (manager uniquement)
 *     tags: [Problemes]
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
 *         description: Problème supprimé
 *       404:
 *         description: Problème non trouvé
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const probleme = await Probleme.findByPk(req.params.id);

    if (!probleme) {
      return res.status(404).json({ message: 'Problème non trouvé' });
    }

    await probleme.destroy();

    res.json({ message: 'Problème supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
