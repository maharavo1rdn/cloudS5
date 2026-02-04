import authService from './authService';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: {
    name: string;
    level: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

class UserService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Récupérer le profil de l'utilisateur connecté
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/auth/me`, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du profil');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  // Récupérer un utilisateur par ID
  async getUserById(userId: number): Promise<UserProfile | null> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/users/${userId}`, { headers });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Lister tous les utilisateurs (pour les managers)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/users`, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  // Vérifier la connectivité au backend
  async checkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Récupérer les utilisateurs bloqués (Manager uniquement)
  async getBlockedUsers(): Promise<any[]> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/users/blocked`, { headers });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs bloqués');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs bloqués:', error);
      return [];
    }
  }

  // Bloquer un utilisateur (Manager uniquement)
  async blockUser(userId: number): Promise<void> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/users/${userId}/block`, {
        method: 'PUT',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du blocage de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors du blocage de l\'utilisateur:', error);
      throw error;
    }
  }

  // Débloquer un utilisateur (Manager uniquement)
  async unblockUser(userId: number): Promise<void> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/users/${userId}/unblock`, {
        method: 'PUT',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors du déblocage de l\'utilisateur');
      }
    } catch (error) {
      console.error('Erreur lors du déblocage de l\'utilisateur:', error);
      throw error;
    }
  }

  // Réinitialiser les tentatives de connexion d'un utilisateur
  async resetLoginAttempts(userId: number): Promise<void> {
    try {
      const headers = await authService.getAuthHeader();
      const response = await fetch(`${this.baseUrl}/auth/reset-attempts/${userId}`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation des tentatives');
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des tentatives:', error);
      throw error;
    }
  }
}

export default new UserService();
