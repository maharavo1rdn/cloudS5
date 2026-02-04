// Script de test pour vérifier la création d'historique lors de la modification d'un signalement

const API_URL = 'http://localhost:3000/api';

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'manager@gmail.com',
      motdepasse: 'user123'
    })
  });
  
  const data = await response.json();
  return data.token;
}

async function updateSignalement(token, id, newStatus, customDate = null) {
  const body = {
    statut: newStatus,
    commentaire: `Test de changement de statut vers ${newStatus}`
  };
  
  if (customDate) {
    body.date_modification = customDate;
  }
  
  const response = await fetch(`${API_URL}/signalements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  return data;
}

async function getSignalementWithHistory(token, id) {
  const response = await fetch(`${API_URL}/signalements/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
}

async function test() {
  try {
    console.log('🔐 Connexion...');
    const token = await login();
    console.log('✅ Connecté');
    
    const signalementId = 1;
    
    console.log('\n📊 État initial du signalement...');
    let signalement = await getSignalementWithHistory(token, signalementId);
    console.log(`Statut actuel: ${signalement.statut}`);
    console.log(`Avancement: ${signalement.avancement_pourcentage}%`);
    console.log(`Historiques: ${signalement.historiques?.length || 0}`);
    
    console.log('\n🔄 Mise à jour du statut vers EN_COURS avec date personnalisée...');
    const customDate = '2026-01-15T10:30:00';
    await updateSignalement(token, signalementId, 'EN_COURS', customDate);
    console.log(`✅ Mis à jour avec date: ${customDate}`);
    
    console.log('\n📊 Vérification de l\'historique...');
    signalement = await getSignalementWithHistory(token, signalementId);
    console.log(`Nouveau statut: ${signalement.statut}`);
    console.log(`Nouveau avancement: ${signalement.avancement_pourcentage}%`);
    console.log(`Historiques: ${signalement.historiques?.length || 0}`);
    
    if (signalement.historiques && signalement.historiques.length > 0) {
      console.log('\n📜 Dernier historique:');
      const lastHistory = signalement.historiques[0];
      console.log(`  Ancien statut: ${lastHistory.ancien_statut} (${lastHistory.ancien_avancement}%)`);
      console.log(`  Nouveau statut: ${lastHistory.nouveau_statut} (${lastHistory.nouveau_avancement}%)`);
      console.log(`  Date: ${lastHistory.date_modification}`);
      console.log(`  User: ${lastHistory.user?.nom} ${lastHistory.user?.prenom}`);
    }
    
    console.log('\n🔄 Mise à jour du statut vers TERMINE...');
    await updateSignalement(token, signalementId, 'TERMINE');
    console.log('✅ Mis à jour');
    
    console.log('\n📊 Vérification finale...');
    signalement = await getSignalementWithHistory(token, signalementId);
    console.log(`Statut final: ${signalement.statut}`);
    console.log(`Avancement final: ${signalement.avancement_pourcentage}%`);
    console.log(`Total historiques: ${signalement.historiques?.length || 0}`);
    
    console.log('\n✅ Test terminé avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

test();
