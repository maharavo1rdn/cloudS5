import { Preferences } from '@capacitor/preferences';
import userService, { UserProfile } from './userService';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const ROLE_KEY = 'user_role';

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

interface FirebaseError {
  error: {
    message: string;
  };
}

class AuthService {
  private signInUrl = import.meta.env.SIGN_IN_FIREBASE_URL || 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBLueXEEBaC4KRaPYBQ5RmcGCL5sxzwa6E';
  private signUpUrl = import.meta.env.SIGN_UP_FIREBASE_URL || 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBLueXEEBaC4KRaPYBQ5RmcGCL5sxzwa6E';

  async login(email: string, password: string): Promise<FirebaseAuthResponse> {
    try {
      const response = await fetch(this.signInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });
      console.log(this.signInUrl);
      const data = await response.json();

      if (!response.ok) {
        const error = data as FirebaseError;
        throw new Error(this.getErrorMessage(error.error.message));
      }

      // Récupérer ou créer le profil utilisateur dans Firestore
      const userProfile = await userService.getOrCreateUserProfile(data.localId, data.email);

      // Stocker le token et les données utilisateur avec le rôle
      await this.setToken(data.idToken);
      await this.setUserData({
        email: data.email,
        localId: data.localId,
      });
      await this.setUserRole(userProfile.role);

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string): Promise<FirebaseAuthResponse> {
    try {
      const response = await fetch(this.signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as FirebaseError;
        throw new Error(this.getErrorMessage(error.error.message));
      }

      // Créer le profil utilisateur dans Firestore avec rôle 'user'
      const userProfile = await userService.createUserProfile(data.localId, data.email, 'user');

      // Stocker le token et les données utilisateur
      await this.setToken(data.idToken);
      await this.setUserData({
        email: data.email,
        localId: data.localId,
      });
      await this.setUserRole(userProfile.role);

      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
    await Preferences.remove({ key: ROLE_KEY });
  }

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  async getUserData(): Promise<any> {
    const { value } = await Preferences.get({ key: USER_KEY });
    return value ? JSON.parse(value) : null;
  }

  async getUserRole(): Promise<'user' | 'manager' | null> {
    const { value } = await Preferences.get({ key: ROLE_KEY });
    return value as 'user' | 'manager' | null;
  }

  async isManager(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'manager';
  }

  // Vérifier la connectivité Firestore
  async checkFirestoreConnectivity(): Promise<boolean> {
    try {
      return await userService.checkConnectivity();
    } catch (error) {
      return false;
    }
  }

  private async setToken(token: string): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }

  private async setUserData(userData: any): Promise<void> {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(userData) });
  }

  private async setUserRole(role: 'user' | 'manager'): Promise<void> {
    await Preferences.set({ key: ROLE_KEY, value: role });
  }

  private getErrorMessage(firebaseError: string): string {
    const errorMessages: Record<string, string> = {
      'EMAIL_NOT_FOUND': 'Email ou mot de passe incorrect',
      'INVALID_PASSWORD': 'Email ou mot de passe incorrect',
      'USER_DISABLED': 'Ce compte a été désactivé',
      'EMAIL_EXISTS': 'Cet email est déjà utilisé',
      'INVALID_EMAIL': 'Email invalide',
      'WEAK_PASSWORD': 'Mot de passe trop faible (minimum 6 caractères)',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Trop de tentatives. Réessayez plus tard',
    };

    return errorMessages[firebaseError] || 'Une erreur est survenue. Veuillez réessayer.';
  }
}

export default new AuthService();
