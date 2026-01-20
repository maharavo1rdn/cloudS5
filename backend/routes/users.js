import { Router } from 'express';
import UserService from '../services/userService.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await UserService.getUserProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtenir un utilisateur par ID
 *     tags: [Users]
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
 *         description: Utilisateur trouvé
 *       404:
 *         description: Utilisateur non trouvé
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les permissions
    UserService.checkUserPermission(req.user.id, id);

    const user = await UserService.getUserById(id);
    res.json(user);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ message: error.message });
    } else if (error.message === 'Accès non autorisé') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

// Route pour mettre à jour un utilisateur
/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Modifier les informations d'un utilisateur
 *     tags: [Users]
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
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Utilisateur modifié
 *       400:
 *         description: Username ou email déjà utilisé
 *       403:
 *         description: Accès non autorisé
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    // Vérifier les permissions
    UserService.checkUserPermission(req.user.id, id);

    const user = await UserService.updateUser(id, { username, email });
    res.json(user);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ message: error.message });
    } else if (error.message === 'Accès non autorisé') {
      res.status(403).json({ message: error.message });
    } else if (error.message.includes('unique constraint')) {
      res.status(400).json({ message: 'Username ou email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

// Route pour supprimer un utilisateur
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier les permissions
    UserService.checkUserPermission(req.user.id, id);

    const result = await UserService.deleteUser(id);
    res.json(result);
  } catch (error) {
    if (error.message === 'Utilisateur non trouvé') {
      res.status(404).json({ message: error.message });
    } else if (error.message === 'Accès non autorisé') {
      res.status(403).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

export default router;