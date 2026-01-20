require("dotenv").config({ path: "../.env" });

console.log("🔍 Test des variables d'environnement Firebase...\n");

// Vérifier les variables essentielles
const requiredVars = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
];

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  const present = !!value;
  console.log(`${varName}: ${present ? "✅ Présent" : "❌ Manquant"}`);
  if (!present) allPresent = false;
});

if (allPresent) {
  console.log("\n🎉 Toutes les variables Firebase sont configurées !");
  console.log("📝 Projet ID:", process.env.FIREBASE_PROJECT_ID);
  console.log(
    "📧 Client Email:",
    process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 50) + "..."
  );
} else {
  console.log(
    "\n❌ Certaines variables sont manquantes. Vérifiez votre fichier .env"
  );
  process.exit(1);
}
