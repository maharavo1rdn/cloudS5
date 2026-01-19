import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class AuthService {
  // Fonction d'inscription
  static async register(userData) {
    const { username, email, password } = userData;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new Error('Utilisateur déjà existant avec cet email ou username');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  // Fonction de connexion
  static async login(credentials) {
    const { email, password } = credentials;

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Retourner l'utilisateur sans mot de passe et le token
    const { password: _, ...userWithoutPassword } = user.toJSON();
    return {
      user: userWithoutPassword,
      token
    };
  }

  // Fonction pour vérifier un token (utile pour les middlewares)
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }
}

export default AuthService;