import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface LoginAttempt {
  attempts: number;
  blocked_until?: any;
  last_attempt?: any;
}

const collectionName = 'login_attempts';
const settingsCollection = 'settings';

const keyFromEmail = (email: string) => encodeURIComponent(email.toLowerCase());

// Simple in-memory cache for settings
const settingsCache: Record<string, { value: number; ts: number }> = {};
const SETTINGS_TTL = 60 * 1000; // 60 seconds

async function getNumberSetting(key: string, fallback: number): Promise<number> {
  const now = Date.now();
  if (settingsCache[key] && now - settingsCache[key].ts < SETTINGS_TTL) {
    return settingsCache[key].value;
  }

  try {
    const docRef = doc(db, settingsCollection, key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      const value = parseInt(data.value, 10);
      const v = Number.isNaN(value) ? fallback : value;
      settingsCache[key] = { value: v, ts: now };
      return v;
    }
  } catch (err) {
    console.error('Error fetching setting', key, err);
  }

  // fallback
  settingsCache[key] = { value: fallback, ts: now };
  return fallback;
}

class LoginAttemptService {
  async getAttempt(email: string): Promise<LoginAttempt | null> {
    try {
      const docRef = doc(db, collectionName, keyFromEmail(email));
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      return data as LoginAttempt;
    } catch (err) {
      console.error('Error getting login attempt', err);
      return null;
    }
  }

  async initAttemptIfMissing(email: string): Promise<void> {
    const key = keyFromEmail(email);
    const docRef = doc(db, collectionName, key);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, { attempts: 0, blocked_until: null, last_attempt: null });
    }
  }

  async incrementAttempt(email: string): Promise<{ blocked: boolean; attempts: number; blocked_until?: Date | null }> {
    const maxAttempts = await getNumberSetting('max_login_attempts', 3);
    const blockMinutes = await getNumberSetting('login_block_minutes', 15);

    const key = keyFromEmail(email);
    const docRef = doc(db, collectionName, key);
    const snap = await getDoc(docRef);
    let attempts = 0;
    let blocked_until: any = null;

    if (!snap.exists()) {
      attempts = 1;
      await setDoc(docRef, { attempts, last_attempt: new Date(), blocked_until: null });
    } else {
      const data = snap.data() as LoginAttempt;

      // if already blocked and still within the blocked period, keep it blocked
      if (data.blocked_until) {
        const blockedDate = data.blocked_until?.toDate ? data.blocked_until.toDate() : new Date(data.blocked_until);
        if (new Date() < blockedDate) {
          return { blocked: true, attempts: data.attempts || 0, blocked_until: blockedDate };
        }
      }

      attempts = (data.attempts || 0) + 1;
      const updateData: any = { attempts, last_attempt: new Date() };
      if (attempts >= maxAttempts) {
        blocked_until = new Date(Date.now() + blockMinutes * 60 * 1000);
        updateData.blocked_until = blocked_until;
      }
      await updateDoc(docRef, updateData);
    }

    return { blocked: !!blocked_until, attempts, blocked_until };
  }

  async resetAttempt(email: string): Promise<void> {
    const key = keyFromEmail(email);
    const docRef = doc(db, collectionName, key);
    await setDoc(docRef, { attempts: 0, last_attempt: null, blocked_until: null }, { merge: true });
  }

  // Récupérer la liste des emails actuellement bloqués
  async getBlockedAttempts(): Promise<Array<{ email: string; attempts: number; blocked_until: Date }>> {
    try {
      const now = new Date();
      const q = query(collection(db, collectionName), where('blocked_until', '>', now));
      const snap = await getDocs(q);
      const results: Array<{ email: string; attempts: number; blocked_until: Date }> = [];
      snap.forEach(docSnap => {
        const data = docSnap.data();
        results.push({
          email: decodeURIComponent(docSnap.id),
          attempts: data.attempts || 0,
          blocked_until: data.blocked_until?.toDate ? data.blocked_until.toDate() : new Date(data.blocked_until)
        });
      });
      return results;
    } catch (err) {
      console.error('Error listing blocked attempts', err);
      return [];
    }
  }
}

export default new LoginAttemptService();
