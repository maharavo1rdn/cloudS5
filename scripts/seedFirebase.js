const admin = require('firebase-admin');

// ⚠️ IMPORTANT: Remplacez par votre propre clé de service Firebase
// Téléchargez-la depuis Firebase Console > Paramètres du projet > Comptes de service > Générer une nouvelle clé privée
const serviceAccount = require('./clouds5-49c07-firebase-adminsdk-fbsvc-b55316280a.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Données à importer
const problemes = [
  { id: 1, nom: 'Nid de poule', description: 'Trou profond dans la chaussée' },
  { id: 2, nom: 'Fissure', description: 'Fissure longitudinale ou transversale' },
  { id: 3, nom: 'Affaissement', description: 'Affaissement de la chaussée' },
  { id: 4, nom: 'Désagrégation', description: 'Dégradation de la surface' },
  { id: 5, nom: 'Bosse', description: 'Déformation vers le haut' },
  { id: 6, nom: 'Ornière', description: 'Déformation en creux due au trafic' },
  { id: 7, nom: 'Éboulement', description: 'Effondrement de talus' },
  { id: 8, nom: 'Végétation', description: 'Envahissement par la végétation' }
];

const users = [
  {
    email: 'test@example.com',
    role: 'user',
    nom: 'Dupont',
    prenom: 'Jean',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-20T10:00:00.000Z'))
  },
  {
    email: 'manager@example.com',
    role: 'manager',
    nom: 'Admin',
    prenom: 'System',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T09:00:00.000Z'))
  },
  {
    email: 'other@example.com',
    role: 'user',
    nom: 'Martin',
    prenom: 'Marie',
    createdAt: admin.firestore.Timestamp.fromDate(new Date('2026-01-10T08:00:00.000Z'))
  }
];

const entreprises = [
  { id: 1, nom: 'Colas Madgascar ', description: 'Entreprise spécialisée dans les travaux routiers' },
  { id: 2, nom: 'Batimax Construction', description: 'Maintenance et réparation de chaussées' }
];

const routes = [
  {
    id: 'route1',
    user_id: 'user123',
    budget: 7500000,
    probleme_id: 1,
    description: 'Grand nid de poule dangereux sur la route principale',
    superficie: 2.5,
    statut: 'A_FAIRE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-15T14:30:00.000Z'))
  },
  {
    id: 'route2',
    user_id: 'otherUser',
    budget: 1500000,
    probleme_id: 2,
    description: 'Fissure importante nécessitant réparation urgente',
    superficie: 5.0,
    statut: 'EN_COURS',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-12T11:15:00.000Z')),
    entreprise_id: 1
  },
  {
    id: 'route3',
    user_id: 'user123',
    budget: 500000,
    probleme_id: 3,
    description: 'Affaissement de la chaussée après les pluies',
    superficie: 8.0,
    statut: 'TERMINE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-05T09:45:00.000Z')),
    date_fin: admin.firestore.Timestamp.fromDate(new Date('2026-01-18T16:20:00.000Z')),
    entreprise_id: 1
  },
  {
    id: 'route4',
    user_id: 'otherUser',
    budget: 8020000,
    probleme_id: 4,
    description: 'Désagrégation importante de la surface',
    superficie: 12.0,
    statut: 'A_FAIRE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-18T13:10:00.000Z'))
  },
  {
    id: 'route5',
    user_id: 'user123',
    budget: 6900000,
    probleme_id: 5,
    description: 'Bosse créée par le trafic lourd',
    superficie: 3.5,
    statut: 'EN_COURS',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-10T08:30:00.000Z')),
    entreprise_id: 2
  },
  {
    id: 'route6',
    user_id: 'otherUser',
    budget: 1200000,
    probleme_id: 6,
    description: 'Ornière profonde suite au passage des camions',
    superficie: 15.0,
    statut: 'A_FAIRE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-19T15:45:00.000Z'))
  },
  {
    id: 'route7',
    user_id: 'user123',
    budget: 1500000,
    probleme_id: 7,
    description: 'Éboulement du talus après fortes pluies',
    superficie: 20.0,
    statut: 'EN_COURS',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-08T12:00:00.000Z')),
    entreprise_id: 1
  },
  {
    id: 'route8',
    user_id: 'otherUser',
    budget: 2000000,
    probleme_id: 8,
    description: 'Végétation envahissant la chaussée',
    superficie: 6.0,
    statut: 'TERMINE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-03T10:15:00.000Z')),
    date_fin: admin.firestore.Timestamp.fromDate(new Date('2026-01-16T14:30:00.000Z')),
    entreprise_id: 2
  },
  {
    id: 'route9',
    user_id: 'user123',
    budget: 7500000,
    probleme_id: 1,
    description: 'Série de petits nids de poule',
    superficie: 4.0,
    statut: 'A_FAIRE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-20T09:20:00.000Z'))
  },
  {
    id: 'route10',
    user_id: 'otherUser',
    budget: 3500000,
    probleme_id: 2,
    description: 'Fissures en étoile au centre de la route',
    superficie: 3.0,
    statut: 'TERMINE',
    date_creation: admin.firestore.Timestamp.fromDate(new Date('2026-01-01T11:30:00.000Z')),
    date_fin: admin.firestore.Timestamp.fromDate(new Date('2026-01-14T13:45:00.000Z')),
    entreprise_id: 1
  }
];

const routePoints = [
  { routeId: 'route1', point: { id: 'point1', route_id: 'route1', latitude: -18.8792, longitude: 47.5079, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route2', point: { id: 'point2', route_id: 'route2', latitude: -18.8850, longitude: 47.5150, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route3', point: { id: 'point3', route_id: 'route3', latitude: -18.8700, longitude: 47.5000, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route4', point: { id: 'point4', route_id: 'route4', latitude: -18.8950, longitude: 47.5200, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route5', point: { id: 'point5', route_id: 'route5', latitude: -18.8650, longitude: 47.5250, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route6', point: { id: 'point6', route_id: 'route6', latitude: -18.9000, longitude: 47.5100, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route7', point: { id: 'point7', route_id: 'route7', latitude: -18.8600, longitude: 47.4950, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route8', point: { id: 'point8', route_id: 'route8', latitude: -18.8750, longitude: 47.5300, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route9', point: { id: 'point9', route_id: 'route9', latitude: -18.8900, longitude: 47.5050, ordre: 1, point_statut: 'ACTIF' }},
  { routeId: 'route10', point: { id: 'point10', route_id: 'route10', latitude: -18.8820, longitude: 47.4980, ordre: 1, point_statut: 'ACTIF' }}
];

async function seedDatabase() {
  console.log('🚀 Début de l\'importation des données...');

  try {
    // 1. Importer les problèmes
    console.log('📝 Importation des types de problèmes...');
    for (const probleme of problemes) {
      await db.collection('problemes').doc(probleme.id.toString()).set(probleme);
      console.log(`✅ Problème ${probleme.id} importé`);
    }

    // 2. Importer les utilisateurs
    console.log('👥 Importation des utilisateurs...');
    await db.collection('users').doc('user123').set(users[0]);
    await db.collection('users').doc('manager123').set(users[1]);
    await db.collection('users').doc('otherUser').set(users[2]);
    console.log('✅ Utilisateurs importés');

    // 3. Importer les entreprises
    console.log('🏢 Importation des entreprises...');
    for (const entreprise of entreprises) {
      await db.collection('entreprises').doc(entreprise.id.toString()).set(entreprise);
      console.log(`✅ Entreprise ${entreprise.id} importée`);
    }

    // 4. Importer les statuts de point (point_statut)
    const pointStatuts = [
      { code: 'A_FAIRE', description: 'Signalement créé', niveau: 1 },
      { code: 'EN_COURS', description: 'Travaux en cours', niveau: 2 },
      { code: 'TERMINE', description: 'Travaux terminés', niveau: 3 }
    ];

    console.log('🏷️ Importation des statuts de points (A_FAIRE / EN_COURS / TERMINE)...');
    for (const ps of pointStatuts) {
      await db.collection('point_statut').doc(ps.code).set(ps);
      console.log(`✅ Statut ${ps.code} importé`);
    }

    // 5. Importer les signalements en tant que documents 'points'
    console.log('📍 Importation des points (signalements)...');
    for (const route of routes) {
      const matchingPoint = routePoints.find(rp => rp.routeId === route.id);
      const createdAt = route.date_creation || admin.firestore.Timestamp.now();
      const pointData = {
        // conserver l'id de route comme id du point pour compatibilité
        nom: route.nom || `Signalement ${route.id}`,
        description: route.description || '',
        probleme_id: route.probleme_id,
        surface_m2: route.superficie || route.surface_m2 || 0,
        budget: route.budget || 0,
        entreprise_id: route.entreprise_id || null,
        date_detection: route.date_creation || admin.firestore.Timestamp.now(),
        date_debut: route.date_debut || null,
        date_fin: route.date_fin || null,
        avancement_pourcentage: route.avancement_pourcentage || 0,
        latitude: matchingPoint?.point?.latitude || 0,
        longitude: matchingPoint?.point?.longitude || 0,
        // s'assurer d'utiliser EXACTEMENT les 3 statuts : 'A_FAIRE'|'EN_COURS'|'TERMINE'
        point_statut: ['A_FAIRE','EN_COURS','TERMINE'].includes(route.statut) ? route.statut : 'A_FAIRE',
        created_by: route.user_id || route.user_id || 'unknown',
        created_at: createdAt,
        // set updated_at = created_at pour éviter undefined (améliore la logique de sync)
        updated_at: createdAt
      };
      // Use route.id as doc id to keep references stable
      await db.collection('points').doc(route.id).set(pointData);
      console.log(`✅ Point (signalement) ${route.id} importé`);

      // --- Ajout d'exemples : images et historique pour ce point ---
      try {
        // Image de démonstration
        await db.collection('points').doc(route.id).collection('images').add({
          image_url: `https://via.placeholder.com/800x600.png?text=${route.id}`,
          firebase_url: `https://via.placeholder.com/800x600.png?text=${route.id}`,
          created_at: admin.firestore.Timestamp.now()
        });

        // Historique : entrée initiale 'A_FAIRE' et entrée correspondant au statut actuel
        const statutMap = { 'A_FAIRE': 0, 'EN_COURS': 50, 'TERMINE': 100 };
        await db.collection('points').doc(route.id).collection('historique').add({
          point_statut: 'A_FAIRE',
          avancement_pourcentage: 0,
          date: route.date_creation || admin.firestore.Timestamp.now()
        });

        if (route.statut && route.statut !== 'A_FAIRE') {
          await db.collection('points').doc(route.id).collection('historique').add({
            point_statut: route.statut,
            avancement_pourcentage: statutMap[route.statut] || 0,
            date: route.date_creation || admin.firestore.Timestamp.now()
          });
        }
      } catch (err) {
        console.warn('⚠️ Erreur en ajoutant images/historique pour', route.id, err);
      }
    }

    // 6. Importer les settings
    console.log('⚙️ Importation des settings...');
    await db.collection('settings').doc('max_login_attempts').set({ code: 'max_login_attempts', value: '3', type: 'number', date: admin.firestore.Timestamp.now() });
    await db.collection('settings').doc('session_lifetime_hours').set({ code: 'session_lifetime_hours', value: '24', type: 'number', date: admin.firestore.Timestamp.now() });
    await db.collection('settings').doc('login_block_minutes').set({ code: 'login_block_minutes', value: '15', type: 'number', date: admin.firestore.Timestamp.now() });
    console.log('✅ Settings importés');

    // 7. Initialiser quelques tentatives de connexion pour les tests
    console.log('🔐 Initialisation des tentatives de connexion...');
    await db.collection('login_attempts').doc(encodeURIComponent('test@example.com')).set({ attempts: 1, last_attempt: admin.firestore.Timestamp.now(), blocked_until: null });
    await db.collection('login_attempts').doc(encodeURIComponent('other@example.com')).set({ attempts: 3, last_attempt: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)), blocked_until: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 13 * 60 * 1000)) });
    console.log('✅ Tentatives initialisées');

    console.log('');
    console.log('🎉 Toutes les données ont été importées avec succès !');
    console.log('📋 Résumé :');
    console.log(`   • ${problemes.length} types de problèmes`);
    console.log(`   • ${users.length} utilisateurs`);
    console.log(`   • ${entreprises.length} entreprises`);
    console.log(`   • ${routes.length} signalements (points)`);
    console.log(`   • 4 statuts de points`);
    console.log(`   • 3 paramètres de sécurité`);
    console.log('');
    console.log('✅ Structure Firebase conforme au schéma SQL (points, problemes, entreprises, point_statut)');

  } catch (error) {
    console.error('❌ Erreur lors de l\'importation :', error);
  } finally {
    process.exit();
  }
}

// Exécuter l'importation
seedDatabase();