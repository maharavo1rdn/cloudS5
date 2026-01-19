import { Router } from 'express';
import AuthService from '../services/authService.js';

const router = Router();

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: 'Corps de la requête manquant' });
    }

    const { username, email, password } = req.body;

    // Validation basique
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const user = await AuthService.register({ username, email, password });
    res.status(201).json({ message: 'Utilisateur créé', user });
  } catch (error) {
    if (error.message === 'Utilisateur déjà existant avec cet email ou username') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    console.log('Requête reçue:', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      contentType: req.headers['content-type'],
      body: req.body
    });

    if (!req.body) {
      return res.status(400).json({ message: 'Corps de la requête manquant' });
    }

    const { email, password } = req.body;

    // Validation basique
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const result = await AuthService.login({ email, password });
    res.json({ message: 'Connexion réussie', ...result });
  } catch (error) {
    if (error.message === 'Email ou mot de passe incorrect') {
      res.status(400).json({ message: error.message });
    } else {
      console.log('ici',error.message)
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

export default router;