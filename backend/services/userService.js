import User from '../models/User.js';

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

  // Mettre à jour un utilisateur
  static async updateUser(id, updateData) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const { username, email } = updateData;

    // Mettre à jour les champs fournis
    if (username) user.username = username;
    if (email) user.email = email;

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  // Supprimer un utilisateur
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