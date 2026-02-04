const admin = require('firebase-admin');
const serviceAccount = require('./scripts/clouds5-49c07-firebase-adminsdk-fbsvc-b55316280a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'clouds5-49c07.firebasestorage.app'
});

const db = admin.firestore();

async function checkImages() {
  try {
    const pointId = 'IDmQSu6PT1nDQ33Q0DEX';
    const imagesSnapshot = await db.collection('points').doc(pointId).collection('images').get();
    
    console.log(`📸 Images trouvées pour le point ${pointId}:`);
    imagesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- Image ${index + 1} ---`);
      console.log('ID:', doc.id);
      console.log('image_url:', data.image_url);
      console.log('firebase_url:', data.firebase_url);
      console.log('created_at:', data.created_at);
    });
    
  } catch (error) {
    console.error('Erreur:', error);
  }
  process.exit(0);
}

checkImages();
