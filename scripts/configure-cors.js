const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Configuration CORS pour Firebase Storage...\n');

// Chemin vers le fichier CORS
const corsFile = path.join(__dirname, '..', 'cors.json');
const bucketName = 'clouds5-49c07.firebasestorage.app';

console.log(`📋 Fichier CORS: ${corsFile}`);
console.log(`🪣 Bucket: gs://${bucketName}\n`);

// Instructions pour l'utilisateur
console.log('⚠️  Pour appliquer la configuration CORS, suivez ces étapes:\n');
console.log('1. Installez Google Cloud CLI si ce n\'est pas déjà fait:');
console.log('   → https://cloud.google.com/sdk/docs/install\n');
console.log('2. Authentifiez-vous avec votre compte Google:');
console.log('   → gcloud auth login\n');
console.log('3. Configurez le projet Firebase:');
console.log('   → gcloud config set project clouds5-49c07\n');
console.log('4. Appliquez la configuration CORS:');
console.log(`   → gsutil cors set ${corsFile} gs://${bucketName}\n`);
console.log('5. Vérifiez la configuration:');
console.log(`   → gsutil cors get gs://${bucketName}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('💡 Alternative: Configurez CORS via la console Firebase Storage:\n');
console.log('   → https://console.cloud.google.com/storage/browser/clouds5-49c07.firebasestorage.app\n');
console.log('   Cliquez sur "Permissions" puis configurez CORS manuellement.\n');
