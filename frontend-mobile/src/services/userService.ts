import authService from './authService';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  blocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

class UserService {
  // Récupérer le profil de l'utilisateur connecté
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const userData = await authService.getUserData();
      if (!userData || !userData.id) {
        return null;
      }

      const userRef = doc(db, 'users', userData.id);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();
      return {
        id: userSnap.id,
        username: data.username || '',
        email: data.email || '',
        role: data.role || 'utilisateur',
        blocked: data.blocked || false,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  // Récupérer un utilisateur par ID
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();
      return {
        id: userSnap.id,
        username: data.username || '',
        email: data.email || '',
        role: data.role || 'utilisateur',
        blocked: data.blocked || false,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Lister tous les utilisateurs (pour les managers)
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'utilisateur',
          blocked: data.blocked || false,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return [];
    }
  }

  // Vérifier la connectivité à Firestore
  async checkConnectivity(): Promise<boolean> {
    try {
      const testRef = collection(db, 'users');
      await getDocs(query(testRef));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Récupérer les utilisateurs bloqués (Manager uniquement)
  async getBlockedUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('blocked', '==', true));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'utilisateur',
          blocked: data.blocked || false,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs bloqués:', error);
      return [];
    }
  }

  // Bloquer un utilisateur (Manager uniquement)
  async blockUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        blocked: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors du blocage de l\'utilisateur:', error);
      throw error;
    }
  }

  // Débloquer un utilisateur (Manager uniquement)
  async unblockUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        blocked: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors du déblocage de l\'utilisateur:', error);
      throw error;
    }
  }

  // Réinitialiser les tentatives de connexion d'un utilisateur
  async resetLoginAttempts(userId: string): Promise<void> {
    try {
      const attemptsRef = doc(db, 'login_attempts', userId);
      await updateDoc(attemptsRef, {
        attempts: 0,
        blocked_until: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des tentatives:', error);
      throw error;
    }
  }

  // Mettre à jour un utilisateur (Manager uniquement)
  async updateUser(userId: string, updates: { username?: string; email?: string; role?: string }): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  // Supprimer un utilisateur (Manager uniquement)
  async deleteUser(userId: string): Promise<void> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }
}

export default new UserService();
