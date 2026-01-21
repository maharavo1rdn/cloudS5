import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface UserProfile {
  email: string;
  uid: string;
  role: 'user' | 'manager';
  createdAt: Date;
  updatedAt: Date;
}

class UserService {
  private readonly COLLECTION_NAME = 'users';

  // Créer un nouveau profil utilisateur
  async createUserProfile(uid: string, email: string, role: 'user' | 'manager' = 'user'): Promise<UserProfile> {
    try {
      const userProfile: UserProfile = {
        email,
        uid,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, this.COLLECTION_NAME, uid), userProfile);
      return userProfile;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Récupérer un profil utilisateur
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Mettre à jour le rôle d'un utilisateur
  async updateUserRole(uid: string, role: 'user' | 'manager'): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, uid);
      await updateDoc(docRef, {
        role,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Obtenir ou créer un profil utilisateur
  async getOrCreateUserProfile(uid: string, email: string): Promise<UserProfile> {
    try {
      let profile = await this.getUserProfile(uid);

      if (!profile) {
        // Créer un nouveau profil avec le rôle 'user' par défaut
        profile = await this.createUserProfile(uid, email, 'user');
      }
      return profile;
    } catch (error) {
      console.error('Erreur lors de getOrCreateUserProfile:', error);
      // En cas d'erreur réseau, retourner un profil temporaire
      return {
        email,
        uid,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  // Vérifier la connectivité
  async checkConnectivity(): Promise<boolean> {
    try {
      // Essayer de récupérer un document pour tester la connexion
      const testDoc = await getDoc(doc(db, '_test', 'connectivity'));
      return true;
    } catch (error) {
      return false;
    }
  }

  private getErrorMessage(error: any): string {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      return 'Connexion réseau indisponible. Vérifiez votre connexion internet.';
    }
    if (error?.code === 'permission-denied') {
      return 'Accès refusé. Vérifiez les permissions Firestore.';
    }
    if (error?.code === 'not-found') {
      return 'Document non trouvé.';
    }
    return error?.message || 'Une erreur est survenue avec Firestore.';
  }
}

export default new UserService();