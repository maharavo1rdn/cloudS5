import { Preferences } from '@capacitor/preferences';
import userService, { UserProfile } from './userService';
import loginAttemptService from './loginAttemptService';

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
      // Check login attempts in Firestore first
      const attempt = await loginAttemptService.getAttempt(email);
      if (attempt && attempt.blocked_until) {
        const blockedUntil = attempt.blocked_until?.toDate ? attempt.blocked_until.toDate() : new Date(attempt.blocked_until);
        if (new Date() < blockedUntil) {
          const remaining = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Compte temporairement bloqué. Réessayez dans ${remaining} minute(s).`);
        }
      }

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
        // Login failed: increment attempts
        await loginAttemptService.incrementAttempt(email);
        const error = data as FirebaseError;
        throw new Error(this.getErrorMessage(error.error.message));
      }

      // Successful login: reset attempts
      await loginAttemptService.resetAttempt(email);

      // Récupérer ou créer le profil utilisateur dans Firestore
      const userProfile = await userService.getOrCreateUserProfile(data.localId, data.email);

      // Déterminer le rôle basé sur l'email (admin@gmail.com = manager)
      const userRole = data.email === 'admin@gmail.com' ? 'manager' : 'user';

      // Stocker le token et les données utilisateur avec le rôle
      await this.setToken(data.idToken);
      await this.setUserData({
        email: data.email,
        localId: data.localId,
      });
      await this.setUserRole(userRole);

      // Start session expiration timer
      this.startSessionTimer();

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

      // Créer le profil utilisateur dans Firestore avec rôle basé sur l'email
      const userRole = data.email === 'admin@gmail.com' ? 'manager' : 'user';
      const userProfile = await userService.createUserProfile(data.localId, data.email, userRole);

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

  private sessionTimer: any = null;

  async logout(): Promise<void> {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
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
    if (!token) return false;
    // verify token expiry
    const valid = this.isTokenValid(token);
    if (!valid) {
      // cleanup expired token
      await this.logout();
      return false;
    }
    // ensure session timer is started
    this.startSessionTimer();
    return true;
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
    const userData = await this.getUserData();
    return userData?.email === 'admin@gmail.com';
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

  private decodeToken(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return decoded;
    } catch (err) {
      return null;
    }
  }

  private isTokenValid(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  }

  private async startSessionTimer() {
    const token = await this.getToken();
    if (!token) return;
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return;
    const expiresAt = decoded.exp * 1000;
    const msLeft = expiresAt - Date.now();
    if (msLeft <= 0) {
      await this.logout();
      return;
    }
    if (this.sessionTimer) clearTimeout(this.sessionTimer);
    this.sessionTimer = setTimeout(async () => {
      await this.logout();
      // optional: notify user via an event or toast; for now we console
      console.log('Session expirée, déconnexion automatique');
    }, msLeft);
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
      'INVALID_EMAIL': 'Adresse email invalide',
      'MISSING_EMAIL': 'Adresse email requise',
      'MISSING_PASSWORD': 'Mot de passe requis',
      'USER_DISABLED': 'Ce compte a été désactivé',
      'EMAIL_EXISTS': 'Cet email est déjà utilisé',
      'WEAK_PASSWORD': 'Mot de passe trop faible (minimum 6 caractères)',
      'TOO_MANY_ATTEMPTS_TRY_LATER': 'Trop de tentatives. Réessayez plus tard',
      'OPERATION_NOT_ALLOWED': 'Connexion temporairement indisponible',
      'INVALID_LOGIN_CREDENTIALS': 'Email ou mot de passe incorrect',
    };

    return errorMessages[firebaseError] || 'Une erreur inattendue est survenue. Vérifiez votre connexion internet.';
  }
}

export default new AuthService();
