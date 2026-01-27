import User from '../models/User.js';
import LoginAttempt from '../models/LoginAttempt.js';

class UserService {
  // Récupérer un utilisateur par ID
  static async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return user;
  }

  // Récupérer le profil de l'utilisateur connecté
  static async getUserProfile(userId) {
    return this.getUserById(userId);
  }

  // Récupérer tous les utilisateurs (Manager)
  static async getAllUsers() {
    const users = await User.findAll({ attributes: { exclude: ['password'] }, order: [['createdAt', 'DESC']], include: [{ model: (await import('../models/Role.js')).default, as: 'role', attributes: ['name','level'] }] });
    return users;
  }

  // Récupérer les utilisateurs bloqués (Manager)
  static async getBlockedUsers() {
    const users = await User.findAll({ where: { isBlocked: true }, attributes: { exclude: ['password'] }, order: [['updatedAt', 'DESC']] });
    return users;
  }

  // Bloquer un utilisateur (Manager)
  static async blockUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Utilisateur non trouvé');
    user.isBlocked = true;
    await user.save();
    return { message: 'Utilisateur bloqué' };
  }

  // Débloquer un utilisateur (Manager) - réinitialise aussi les tentatives
  static async unblockUser(id) {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Utilisateur non trouvé');
    user.isBlocked = false;
    await user.save();

    // Réinitialiser tentatives si présent
    const attempt = await LoginAttempt.findOne({ where: { user_id: id } });
    if (attempt) {
      attempt.attempts = 0;
      attempt.blocked_until = null;
      await attempt.save();
    }

    return { message: 'Utilisateur débloqué et tentatives réinitialisées' };
  }

  // Créer un utilisateur (Manager)
  static async createUser(data) {
    const { username, email, password, role } = data;
    if (!username || !email || !password) throw new Error('username, email et password requis');

    // Vérifier unicité
    const existing = await User.findOne({ where: { [User.sequelize.Op.or]: [{ email }, { username }] } });
    if (existing) throw new Error('Utilisateur déjà existant');

    // Trouver le rôle
    const Role = (await import('./../models/Role.js')).default;
    const roleRow = await Role.findOne({ where: { name: role || 'utilisateur' } });

    const bcrypt = await import('bcryptjs');
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashed, role_id: roleRow ? roleRow.id : null });
    const { password: pwd, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  // Mettre à jour un utilisateur
  static async updateUser(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const { username, email, role } = updateData;

    // Mettre à jour les champs fournis
    if (username) user.username = username;
    if (email) user.email = email;

    if (role) {
      const Role = (await import('./../models/Role.js')).default;
      const roleRow = await Role.findOne({ where: { name: role } });
      if (roleRow) user.role_id = roleRow.id;
    }

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  // Supprimer un utilisateur (Manager)
  static async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    await user.destroy();
    return { message: 'Utilisateur supprimé avec succès' };
  }

  // Vérifier si l'utilisateur a le droit d'accéder à une ressource
  static checkUserPermission(requestingUserId, targetUserId) {
    if (requestingUserId !== parseInt(targetUserId)) {
      throw new Error('Accès non autorisé');
    }
  }
}

export default UserService;