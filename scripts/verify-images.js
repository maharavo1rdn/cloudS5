const admin = require('firebase-admin');
const serviceAccount = require('./clouds5-49c07-firebase-adminsdk-fbsvc-b55316280a.json');
const https = require('https');
const http = require('http');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function checkUrl(url, timeout = 8000) {
  return new Promise((resolve) => {
    try {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.request(url, { method: 'HEAD' }, (res) => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
      });
      req.on('error', () => resolve({ ok: false, status: null }));
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve({ ok: false, status: 'timeout' });
      });
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 'error' });
    }
  });
}

async function verify() {
  console.log('🔎 Vérification des images dans Firestore...');
  const pointsSnap = await db.collection('points').get();
  let total = 0;
  let broken = 0;

  for (const pt of pointsSnap.docs) {
    const imagesSnap = await db.collection('points').doc(pt.id).collection('images').get();
    if (imagesSnap.empty) continue;
    console.log(`\n📍 Point ${pt.id} — ${imagesSnap.size} image(s)`);
    for (const imgDoc of imagesSnap.docs) {
      const data = imgDoc.data();
      const url = data.image_url || data.firebase_url;
      total++;
      const res = await checkUrl(url);
      if (res.ok) {
        console.log(`  ✅ ${url} (${res.status})`);
      } else {
        broken++;
        console.log(`  ❌ ${url} (status: ${res.status})`);
      }
    }
  }

  console.log('\n✅ Vérification terminée');
  console.log(`Total checked: ${total}. Broken: ${broken}`);
  process.exit(broken > 0 ? 2 : 0);
}

verify().catch(err => { console.error(err); process.exit(1); });