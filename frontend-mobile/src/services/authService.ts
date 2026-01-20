import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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
  private signInUrl = import.meta.env.VITE_SIGN_IN_FIREBASE_URL || '';
  private signUpUrl = import.meta.env.VITE_SIGN_UP_FIREBASE_URL || '';

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

      const data = await response.json();

      if (!response.ok) {
        const error = data as FirebaseError;
        throw new Error(this.getErrorMessage(error.error.message));
      }

      // Stocker le token et les données utilisateur
      await this.setToken(data.idToken);
      await this.setUserData({
        email: data.email,
        localId: data.localId,
      });

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

      // Stocker le token et les données utilisateur
      await this.setToken(data.idToken);
      await this.setUserData({
        email: data.email,
        localId: data.localId,
      });

      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
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

  private async setToken(token: string): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }

  private async setUserData(userData: any): Promise<void> {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(userData) });
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
