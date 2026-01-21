import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import LoginAttempt from '../models/LoginAttempt.js';
import Setting from '../models/Setting.js';
import Role from '../models/Role.js';

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
    const defaultRole = await Role.findOne({ where: { name: 'utilisateur' } });
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role_id: defaultRole ? defaultRole.id : null,
    });

    // Retourner l'utilisateur sans le mot de passe
    const userWithRole = await User.findByPk(user.id, { include: [{ model: Role, as: 'role' }] });
    const { password: _, ...userWithoutPassword } = userWithRole.toJSON();
    return userWithoutPassword;
  }

  // Fonction de connexion avec gestion des tentatives
  static async login(credentials) {
    const { email, password } = credentials;

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'role' }] });
    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.isBlocked) {
      throw new Error('Compte bloqué. Contactez un administrateur.');
    }

    // Récupérer ou créer les tentatives de connexion
    let loginAttempt = await LoginAttempt.findOne({ where: { user_id: user.id } });
    if (!loginAttempt) {
      loginAttempt = await LoginAttempt.create({ user_id: user.id });
    }

    // Vérifier si l'utilisateur est temporairement bloqué
    if (loginAttempt.blocked_until && new Date() < new Date(loginAttempt.blocked_until)) {
      const remainingTime = Math.ceil((new Date(loginAttempt.blocked_until) - new Date()) / 60000);
      throw new Error(`Compte temporairement bloqué. Réessayez dans ${remainingTime} minute(s).`);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrémenter les tentatives
      const maxAttempts = await this.getMaxLoginAttempts();
      loginAttempt.attempts += 1;
      loginAttempt.last_attempt = new Date();

      if (loginAttempt.attempts >= maxAttempts) {
        // Bloquer temporairement (15 minutes)
        loginAttempt.blocked_until = new Date(Date.now() + 15 * 60 * 1000);
        await loginAttempt.save();
        throw new Error(`Nombre de tentatives dépassé. Compte bloqué pour 15 minutes.`);
      }

      await loginAttempt.save();
      throw new Error('Email ou mot de passe incorrect');
    }

    // Réinitialiser les tentatives en cas de succès
    loginAttempt.attempts = 0;
    loginAttempt.blocked_until = null;
    await loginAttempt.save();

    // Récupérer la durée de vie de la session
    const sessionLifetime = await this.getSessionLifetime();

    // Générer le token JWT avec durée de vie configurable
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role ? user.role.name : null,
        level: user.role ? user.role.level : 1
      },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionLifetime}h` }
    );

    // Retourner l'utilisateur sans mot de passe et le token
    const { password: _, ...userWithoutPassword } = user.toJSON();
    // Nettoyer le rôle pour éviter les problèmes de sérialisation
    if (userWithoutPassword.role) {
      userWithoutPassword.role = {
        name: userWithoutPassword.role.name,
        level: userWithoutPassword.role.level
      };
    }
    return {
      user: userWithoutPassword,
      token
    };
  }

  // Récupérer le nombre maximum de tentatives depuis settings
  static async getMaxLoginAttempts() {
    const setting = await Setting.findOne({ where: { code: 'max_login_attempts' } });
    return setting ? parseInt(setting.value, 10) : 3;
  }

  // Récupérer la durée de vie des sessions depuis settings
  static async getSessionLifetime() {
    const setting = await Setting.findOne({ where: { code: 'session_lifetime_hours' } });
    return setting ? parseInt(setting.value, 10) : 24;
  }

  // Réinitialiser les tentatives de connexion pour un utilisateur
  static async resetLoginAttempts(userId) {
    const loginAttempt = await LoginAttempt.findOne({ where: { user_id: userId } });
    if (loginAttempt) {
      loginAttempt.attempts = 0;
      loginAttempt.blocked_until = null;
      await loginAttempt.save();
    }

    // Débloquer l'utilisateur si nécessaire
    const user = await User.findByPk(userId);
    if (user && user.isBlocked) {
      user.isBlocked = false;
      await user.save();
    }

    return { message: 'Tentatives de connexion réinitialisées' };
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