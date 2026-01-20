import express from 'express';
import Setting from '../models/Setting.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Middleware pour vérifier le rôle admin (level >= 10)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.level < 10) {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin requis.' });
  }
  next();
};

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Récupérer tous les paramètres
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des paramètres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Setting'
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await Setting.findAll();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/settings/{code}:
 *   get:
 *     summary: Récupérer un paramètre par code
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code du paramètre
 *     responses:
 *       200:
 *         description: Paramètre trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       404:
 *         description: Paramètre non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.get('/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { code: req.params.code } });
    if (!setting) {
      return res.status(404).json({ message: 'Paramètre non trouvé' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/settings:
 *   post:
 *     summary: Créer un nouveau paramètre
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - value
 *               - type
 *             properties:
 *               code:
 *                 type: string
 *                 description: Code unique du paramètre
 *               value:
 *                 type: string
 *                 description: Valeur du paramètre
 *               type:
 *                 type: string
 *                 description: Type du paramètre (e.g., number, string)
 *     responses:
 *       201:
 *         description: Paramètre créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { code, value, type } = req.body;
    if (!code || !value || !type) {
      return res.status(400).json({ message: 'Code, value et type sont requis' });
    }
    const setting = await Setting.create({ code, value, type });
    res.status(201).json(setting);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Code déjà existant' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

/**
 * @swagger
 * /api/settings/{code}:
 *   put:
 *     summary: Mettre à jour un paramètre
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code du paramètre
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 description: Nouvelle valeur
 *               type:
 *                 type: string
 *                 description: Nouveau type
 *     responses:
 *       200:
 *         description: Paramètre mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setting'
 *       404:
 *         description: Paramètre non trouvé
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.put('/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { value, type } = req.body;
    const setting = await Setting.findOne({ where: { code: req.params.code } });
    if (!setting) {
      return res.status(404).json({ message: 'Paramètre non trouvé' });
    }
    if (value !== undefined) setting.value = value;
    if (type !== undefined) setting.type = type;
    await setting.save();
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/settings/{code}:
 *   delete:
 *     summary: Supprimer un paramètre
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code du paramètre
 *     responses:
 *       200:
 *         description: Paramètre supprimé
 *       404:
 *         description: Paramètre non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé
 */
router.delete('/:code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { code: req.params.code } });
    if (!setting) {
      return res.status(404).json({ message: 'Paramètre non trouvé' });
    }
    await setting.destroy();
    res.json({ message: 'Paramètre supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;