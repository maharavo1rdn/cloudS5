import { Preferences } from '@capacitor/preferences';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection } from 'firebase/firestore';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const ROLE_KEY = 'user_role';

// Valeurs par défaut si Firestore n'est pas accessible
const DEFAULT_MAX_LOGIN_ATTEMPTS = 3;
const DEFAULT_BLOCK_DURATION_MINUTES = 15;

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered?: boolean;
}

interface BackendError {
  message: string;
}

class AuthService {
  private firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBLueXEEBaC4KRaPYBQ5RmcGCL5sxzwa6E';
  private signInUrl = import.meta.env.SIGN_IN_FIREBASE_URL || 
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.firebaseApiKey}`;
  private signUpUrl = import.meta.env.SIGN_UP_FIREBASE_URL || 
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.firebaseApiKey}`;

  async login(email: string, password: string): Promise<any> {
    try {
      // Vérifier si l'utilisateur est bloqué
      const blockInfo = await this.checkLoginAttempts(email);
      if (blockInfo.isBlocked) {
        const minutesLeft = Math.ceil((blockInfo.blockedUntil!.getTime() - Date.now()) / 60000);
        throw new Error(`Compte bloqué. Réessayez dans ${minutesLeft} minute(s).`);
      }

      const response = await fetch(this.signInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        }),
      });

      const data = await response.json() as FirebaseAuthResponse;

      if (!response.ok) {
        // Enregistrer la tentative échouée
        await this.recordFailedAttempt(email);
        const error = data as any;
        throw new Error(error.error?.message || 'Erreur de connexion');
      }

      // Connexion réussie - réinitialiser les tentatives
      await this.resetLoginAttempts(email);

      // Récupérer les infos utilisateur depuis Firestore
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      let userData: any = { email, role: 'utilisateur' };
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        userData = { id: userDoc.id, ...userDoc.data() };
      }

      // Stocker le token Firebase et les données utilisateur
      await this.setToken(data.idToken);
      await this.setUserData({
        id: userData.id || data.localId,
        username: userData.username || email.split('@')[0],
        email: data.email,
        localId: data.localId
      });
      
      // Stocker le rôle
      const roleName = userData.role || 'utilisateur';
      await this.setUserRole(roleName === 'manager' ? 'manager' : 'utilisateur');

      // Start session expiration timer
      this.startSessionTimer();

      return { token: data.idToken, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, username?: string): Promise<any> {
    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // ✅ Register via Firebase Auth
      const response = await fetch(this.signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true
        }),
      });

      const data = await response.json() as FirebaseAuthResponse;

      if (!response.ok) {
        const error = data as any;
        throw new Error(error.error?.message || 'Erreur lors de l\'inscription');
      }

      const finalUsername = username || email.split('@')[0];

      await this.setToken(data.idToken);
      await this.setUserData({
        id: data.localId,
        username: finalUsername,
        email: data.email,
        localId: data.localId
      });

      await this.setUserRole('utilisateur');  

      try {
        const { db } = await import('../config/firebase');
        const { doc, setDoc, Timestamp } = await import('firebase/firestore');
        
        await setDoc(doc(db, 'users', data.localId), {
          email: data.email,
          username: finalUsername,
          password: hashedPassword,
          role: 'utilisateur',
          blocked: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Document utilisateur créé dans Firestore avec password hashé');
      } catch (fbError) {
        console.warn('⚠️ Erreur création document Firestore (non bloquant):', fbError);
      }

      return { token: data.idToken, user: { id: data.localId, email: data.email, username: finalUsername } };
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

  async getUserRole(): Promise<'utilisateur' | 'manager' | null> {
    const { value } = await Preferences.get({ key: ROLE_KEY });
    return value as 'utilisateur' | 'manager' | null;
  }

  async isManager(): Promise<boolean> {
    const role = await this.getUserRole();
    return role === 'manager';
  }

  // Récupérer l'en-tête Authorization pour les appels backend
  async getAuthHeader(): Promise<HeadersInit> {
    const token = await this.getToken();
    if (!token) throw new Error('Non authentifié');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
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
      console.log('Session expirée, déconnexion automatique');
    }, msLeft);
  }

  private async setUserData(userData: any): Promise<void> {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(userData) });
  }

  private async setUserRole(role: 'utilisateur' | 'manager'): Promise<void> {
    await Preferences.set({ key: ROLE_KEY, value: role });
  }

  // Récupérer un paramètre depuis Firestore
  private async getSetting(code: string, defaultValue: any): Promise<any> {
    try {
      const settingRef = doc(db, 'settings', code);
      const settingSnap = await getDoc(settingRef);
      
      if (settingSnap.exists()) {
        const data = settingSnap.data();
        const value = data.value;
        
        // Convertir selon le type
        if (data.type === 'number') {
          return parseInt(value, 10) || defaultValue;
        }
        return value;
      }
      
      return defaultValue;
    } catch (error) {
      console.warn(`Erreur récupération setting ${code}:`, error);
      return defaultValue;
    }
  }

  // Vérifier les tentatives de connexion et le blocage
  private async checkLoginAttempts(email: string): Promise<{ isBlocked: boolean; blockedUntil?: Date }> {
    try {
      const attemptRef = doc(db, 'login_attempts', email);
      const attemptSnap = await getDoc(attemptRef);

      if (!attemptSnap.exists()) {
        return { isBlocked: false };
      }

      const data = attemptSnap.data();
      const blockedUntil = data.blocked_until?.toDate();

      if (blockedUntil && blockedUntil > new Date()) {
        return { isBlocked: true, blockedUntil };
      }

      return { isBlocked: false };
    } catch (error) {
      console.error('Erreur vérification tentatives:', error);
      return { isBlocked: false };
    }
  }

  // Enregistrer une tentative de connexion échouée
  private async recordFailedAttempt(email: string): Promise<void> {
    try {
      const attemptRef = doc(db, 'login_attempts', email);
      const attemptSnap = await getDoc(attemptRef);

      // Récupérer les paramètres depuis Firestore
      const maxAttempts = await this.getSetting('max_login_attempts', DEFAULT_MAX_LOGIN_ATTEMPTS);
      const blockDuration = await this.getSetting('block_duration_minutes', DEFAULT_BLOCK_DURATION_MINUTES);

      const now = Timestamp.now();
      let attempts = 1;
      let blockedUntil = null;

      if (attemptSnap.exists()) {
        const data = attemptSnap.data();
        attempts = (data.attempts || 0) + 1;
      }

      // Bloquer si >= maxAttempts
      if (attempts >= maxAttempts) {
        const blockDate = new Date();
        blockDate.setMinutes(blockDate.getMinutes() + blockDuration);
        blockedUntil = Timestamp.fromDate(blockDate);
      }

      await setDoc(attemptRef, {
        email,
        attempts,
        last_attempt: now,
        blocked_until: blockedUntil,
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.error('Erreur enregistrement tentative:', error);
    }
  }

  // Réinitialiser les tentatives après connexion réussie
  private async resetLoginAttempts(email: string): Promise<void> {
    try {
      const attemptRef = doc(db, 'login_attempts', email);
      await setDoc(attemptRef, {
        email,
        attempts: 0,
        last_attempt: Timestamp.now(),
        blocked_until: null,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Erreur réinitialisation tentatives:', error);
    }
  }
}

export default new AuthService();
