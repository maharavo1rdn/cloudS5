import { Router } from 'express';
import UserService from '../services/userService.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await UserService.getUserProfile(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour obtenir un utilisateur par ID
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