import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const ROLE_KEY = 'user_role';

interface BackendAuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role?: {
      name: string;
      level: number;
    };
  };
}

interface BackendError {
  message: string;
}

class AuthService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  private signInUrl = `${this.baseUrl}/auth/login`;
  private signUpUrl = `${this.baseUrl}/auth/register`;
  private meUrl = `${this.baseUrl}/auth/me`;

  async login(email: string, password: string): Promise<BackendAuthResponse> {
    try {
      const response = await fetch(this.signInUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as BackendError;
        throw new Error(error.message || 'Erreur de connexion');
      }

      // Stocker le token et les données utilisateur
      await this.setToken(data.token);
      await this.setUserData({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });
      
      // Stocker le rôle
      const roleName = data.user.role?.name || 'utilisateur';
      await this.setUserRole(roleName === 'manager' || roleName === 'administrateur' ? 'manager' : 'user');

      // Start session expiration timer
      this.startSessionTimer();

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(email: string, password: string, username?: string): Promise<BackendAuthResponse> {
    try {
      const response = await fetch(this.signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username: username || email.split('@')[0], // Utiliser l'email comme username si non fourni
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as BackendError;
        throw new Error(error.message || 'Erreur lors de l\'inscription');
      }

      // Stocker le token et les données utilisateur
      await this.setToken(data.token);
      await this.setUserData({
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      });

      // Stocker le rôle
      const roleName = data.user.role?.name || 'utilisateur';
      await this.setUserRole(roleName === 'manager' || roleName === 'administrateur' ? 'manager' : 'user');

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

  // Récupérer les informations de l'utilisateur depuis le backend
  async getCurrentUser(): Promise<any> {
    try {
      const headers = await this.getAuthHeader();

      const response = await fetch(this.meUrl, {
        headers,
      });

      if (!response.ok) {
        // Token invalide, déconnexion
        await this.logout();
        return null;
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
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
}

export default new AuthService();
