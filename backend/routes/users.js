import { Router } from 'express';
import User from '../models/User.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // Exclure le mot de passe
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour obtenir un utilisateur par ID (admin seulement ou utilisateur lui-même)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur demande son propre profil ou est admin
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    // Vérifier si l'utilisateur met à jour son propre profil
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour les champs
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(userWithoutPassword);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ message: 'Username ou email déjà utilisé' });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

// Route pour supprimer un utilisateur (soft delete ou hard delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur supprime son propre compte
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    await user.destroy();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;