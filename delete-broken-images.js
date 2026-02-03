const admin = require('firebase-admin');
const serviceAccount = require('./scripts/clouds5-49c07-firebase-adminsdk-fbsvc-b55316280a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'clouds5-49c07.firebasestorage.app'
});

const db = admin.firestore();

async function deleteImages() {
  try {
    const pointId = 'IDmQSu6PT1nDQ33Q0DEX';
    const imagesSnapshot = await db.collection('points').doc(pointId).collection('images').get();
    
    console.log(`🗑️  Suppression de ${imagesSnapshot.size} images du point ${pointId}...`);
    
    const batch = db.batch();
    imagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('✅ Images supprimées avec succès');
    
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
}

deleteImages();
