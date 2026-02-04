const admin = require('firebase-admin');
const path = require('path');

// Chemin vers la clé de service Firebase
const serviceAccountPath = path.join(__dirname, '..', 'backend', 'config', 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearFirestore() {
  console.log('🧹 Nettoyage complet de Firestore...');
  
  const collections = ['points', 'users', 'problemes', 'entreprises', 'point_statut', 'settings', 'login_attempts'];
  
  for (const collectionName of collections) {
    try {
      console.log(`🗑️  Suppression de la collection "${collectionName}"...`);
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`   ℹ️  Collection "${collectionName}" déjà vide`);
        continue;
      }
      
      // Supprimer les sous-collections d'abord (pour points)
      if (collectionName === 'points') {
        for (const doc of snapshot.docs) {
          // Supprimer images
          const imagesSnapshot = await doc.ref.collection('images').get();
          for (const imgDoc of imagesSnapshot.docs) {
            await imgDoc.ref.delete();
          }
          
          // Supprimer historique
          const histoSnapshot = await doc.ref.collection('historique').get();
          for (const histoDoc of histoSnapshot.docs) {
            await histoDoc.ref.delete();
          }
        }
      }
      
      // Supprimer les documents de la collection
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`   ✅ ${snapshot.size} documents supprimés de "${collectionName}"`);
      
    } catch (error) {
      console.error(`   ❌ Erreur lors de la suppression de "${collectionName}":`, error.message);
    }
  }
  
  console.log('');
  console.log('✨ Firestore nettoyé avec succès !');
  console.log('');
  console.log('👉 Exécutez maintenant: node seedFirebase.js');
  
  process.exit();
}

clearFirestore();
