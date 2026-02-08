import { db } from '../config/firebase';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';

export interface Setting {
  code: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
  date?: Date;
}

class SettingsService {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupérer un paramètre depuis Firestore avec cache
   */
  async getSetting(code: string, defaultValue: any = null): Promise<any> {
    // Vérifier le cache
    const now = Date.now();
    if (this.cache.has(code) && this.cacheExpiry.get(code)! > now) {
      return this.cache.get(code);
    }

    try {
      const settingRef = doc(db, 'settings', code);
      const settingSnap = await getDoc(settingRef);

      if (settingSnap.exists()) {
        const data = settingSnap.data() as Setting;
        let value: any = data.value;

        // Convertir selon le type
        if (data.type === 'number') {
          const parsed = Number.isFinite(Number(value)) ? Number(value) : parseInt(String(value), 10);
          value = Number.isNaN(parsed) ? defaultValue : parsed;
        } else if (data.type === 'boolean') {
          value = value === 'true' || value === '1' || value === true;
        }

        // Mettre en cache
        this.cache.set(code, value);
        this.cacheExpiry.set(code, now + this.CACHE_DURATION);

        return value;
      }

      return defaultValue;
    } catch (error) {
      console.error(`Erreur récupération setting ${code}:`, error);
      return defaultValue;
    }
  }

  /**
   * Récupérer tous les paramètres
   */
  async getAllSettings(): Promise<Setting[]> {
    try {
      const settingsRef = collection(db, 'settings');
      const querySnapshot = await getDocs(settingsRef);

      return querySnapshot.docs.map(snap => {
        const data = snap.data();
        return {
          code: data.code || snap.id,
          value: data.value,
          type: data.type || 'string',
          date: data.date?.toDate?.(),
        };
      });
    } catch (error) {
      console.error('Erreur récupération settings:', error);
      return [];
    }
  }

  /**
   * Mettre à jour un paramètre (Manager uniquement)
   */
  async updateSetting(code: string, value: string | number | boolean, type: 'string' | 'number' | 'boolean' = 'string'): Promise<void> {
    try {
      const settingRef = doc(db, 'settings', code);
      await setDoc(settingRef, {
        code,
        value: String(value),
        type,
        date: Timestamp.now()
      }, { merge: true });

      // Invalider le cache
      this.cache.delete(code);
      this.cacheExpiry.delete(code);
    } catch (error) {
      console.error(`Erreur mise à jour setting ${code}:`, error);
      throw error;
    }
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Récupérer les paramètres d'authentification
   */
  async getAuthSettings(): Promise<{
    maxLoginAttempts: number;
    blockDurationMinutes: number;
    sessionLifetimeHours: number;
  }> {
    const [maxAttempts, blockDuration, sessionLifetime] = await Promise.all([
      this.getSetting('max_login_attempts', 3),
      this.getSetting('block_duration_minutes', 15),
      this.getSetting('session_lifetime_hours', 24)
    ]);

    return {
      maxLoginAttempts: maxAttempts,
      blockDurationMinutes: blockDuration,
      sessionLifetimeHours: sessionLifetime
    };
  }
}

export default new SettingsService();
