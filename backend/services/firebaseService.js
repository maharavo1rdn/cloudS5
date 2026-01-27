import admin from 'firebase-admin';

class FirebaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialiser Firebase Admin avec les variables d'environnement
      const firebaseConfig = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || "clouds5-49c07",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY ? 
          process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      // If GOOGLE_APPLICATION_CREDENTIALS is set, prefer ADC (mounted service account JSON)
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.log('ℹ️ Found GOOGLE_APPLICATION_CREDENTIALS, using Application Default Credentials');
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`
        });
      }
      // Else if explicit private key provided via env vars, use cert
      else if (firebaseConfig.private_key) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
          databaseURL: `https://${firebaseConfig.project_id}.firebaseio.com`
        });
      }
      // Else fallback to emulator in development
      else if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ No credentials found - using Firebase emulator in development');
        admin.initializeApp({
          projectId: 'clouds5-49c07',
          databaseURL: 'https://clouds5-49c07.firebaseio.com'
        });
      } else {
        throw new Error('No Firebase credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PRIVATE_KEY env vars');
      }

      this.db = admin.firestore();
      this.isInitialized = true;
      console.log('✅ Firebase Admin SDK initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase:', error);
      throw error;
    }
  }

  async getPointsFromFirebase(lastSyncTimestamp = null) {
    await this.initialize();
    
    try {
const pointsMap = new Map();

    const addSnapshotToMap = (snapshot) => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const point = {
          firebase_id: doc.id,
          ...data,
          // Convertir les timestamps Firestore en ISO string
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
          date_detection: data.date_detection?.toDate?.()?.toISOString() || data.date_detection,
          date_debut: data.date_debut?.toDate?.()?.toISOString() || data.date_debut,
          date_fin: data.date_fin?.toDate?.()?.toISOString() || data.date_fin,
        };
        pointsMap.set(doc.id, point);
      });
    };

    if (lastSyncTimestamp) {
      // Firestore doesn't support OR queries easily; run two queries and merge results
      const sinceDate = new Date(lastSyncTimestamp);
      const q1 = this.db.collection('points').where('updated_at', '>', sinceDate);
      const q2 = this.db.collection('points').where('created_at', '>', sinceDate);

      const [snap1, snap2] = await Promise.all([q1.get(), q2.get()]);
      addSnapshotToMap(snap1);
      addSnapshotToMap(snap2);
    } else {
      const snapshot = await this.db.collection('points').get();
      addSnapshotToMap(snapshot);
    }

    const points = Array.from(pointsMap.values());

      console.log(`📥 Récupéré ${points.length} points depuis Firebase`);
      return points;
    } catch (error) {
      console.error('❌ Erreur récupération Firebase:', error);
      throw error;
    }
  }

  async syncPointToFirebase(pointData, operation = 'create') {
    await this.initialize();

    try {
      const collection = this.db.collection('points');
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      const firebaseData = {
        ...pointData,
        updated_at: timestamp,
        // Exclure les champs techniques locaux
        firebase_id: undefined,
        id: undefined,
        created_at: operation === 'create' ? timestamp : pointData.created_at
      };

      // Nettoyer les valeurs undefined
      Object.keys(firebaseData).forEach(key => {
        if (firebaseData[key] === undefined) {
          delete firebaseData[key];
        }
      });

      let result;
      if (operation === 'create') {
        const docRef = await collection.add(firebaseData);
        result = { firebase_id: docRef.id, operation: 'created' };
        console.log(`✅ Point créé dans Firebase: ${docRef.id}`);
      } else if (operation === 'update' && pointData.firebase_id) {
        await collection.doc(pointData.firebase_id).update(firebaseData);
        result = { firebase_id: pointData.firebase_id, operation: 'updated' };
        console.log(`✅ Point mis à jour dans Firebase: ${pointData.firebase_id}`);
      } else if (operation === 'delete' && pointData.firebase_id) {
        await collection.doc(pointData.firebase_id).delete();
        result = { firebase_id: pointData.firebase_id, operation: 'deleted' };
        console.log(`✅ Point supprimé dans Firebase: ${pointData.firebase_id}`);
      } else {
        throw new Error(`Opération non supportée ou firebase_id manquant: ${operation}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ Erreur sync Firebase (${operation}):`, error);
      throw error;
    }
  }

  async syncPointsToFirebase(points, operations = {}) {
    const results = { created: [], updated: [], deleted: [], rejected: [] };

    for (const point of points) {
      try {
        const operation = operations[point.id] || 'create';
        const result = await this.syncPointToFirebase(point, operation);
        results[result.operation].push({ 
          local_id: point.id, 
          firebase_id: result.firebase_id 
        });
      } catch (error) {
        results.rejected.push({
          local_id: point.id,
          reason: error.message,
          error: error.code || 'unknown'
        });
      }
    }

    return results;
  }
}

export default new FirebaseService();