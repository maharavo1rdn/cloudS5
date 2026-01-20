import { Router } from 'express';
import AuthService from '../services/authService.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Inscrire un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Erreur de validation
 *       500:
 *         description: Erreur serveur
 */
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Email ou mot de passe incorrect
 *       500:
 *         description: Erreur serveur
 */
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
    if (error.message.includes('Email ou mot de passe incorrect') || 
        error.message.includes('bloqué') || 
        error.message.includes('tentatives')) {
      res.status(400).json({ message: error.message });
    } else {
      console.log('ici',error.message)
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  }
});

/**
 * @swagger
 * /api/auth/reset-attempts/{userId}:
 *   post:
 *     summary: Réinitialiser les tentatives de connexion d'un utilisateur
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Tentatives réinitialisées
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/reset-attempts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await AuthService.resetLoginAttempts(parseInt(userId, 10));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Récupérer les informations de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: object
 *       401:
 *         description: Non authentifié
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // L'utilisateur est déjà disponible via le middleware authenticateToken
    const user = req.user;
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;