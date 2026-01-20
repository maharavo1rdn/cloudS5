// Données mockées pour le développement frontend
// Ces données simulent les réponses de l'API backend

// Signalements (problèmes routiers)
export const mockSignalements = [
  {
    id: 1,
    latitude: -18.8792,
    longitude: 47.5079,
    date: '2026-01-15',
    status: 'nouveau',
    surface: 150,
    budget: 5000000,
    entreprise: 'COLAS Madagascar',
    description: 'Nid de poule important',
    adresse: 'Avenue de l\'Indépendance'
  },
  {
    id: 2,
    latitude: -18.8850,
    longitude: 47.5150,
    date: '2026-01-10',
    status: 'en_cours',
    surface: 300,
    budget: 12000000,
    entreprise: 'SOGEA SATOM',
    description: 'Route effondrée',
    adresse: 'Route d\'Ivato'
  },
  {
    id: 3,
    latitude: -18.8720,
    longitude: 47.5200,
    date: '2026-01-05',
    status: 'termine',
    surface: 80,
    budget: 3500000,
    entreprise: 'ENTREPRISE RAVINALA',
    description: 'Fissures multiples',
    adresse: 'Boulevard de l\'Europe'
  },
  {
    id: 4,
    latitude: -18.8900,
    longitude: 47.5000,
    date: '2026-01-18',
    status: 'nouveau',
    surface: 200,
    budget: 8000000,
    entreprise: null,
    description: 'Affaissement de chaussée',
    adresse: 'Route Digue'
  },
  {
    id: 5,
    latitude: -18.8750,
    longitude: 47.5250,
    date: '2025-12-20',
    status: 'en_cours',
    surface: 450,
    budget: 25000000,
    entreprise: 'COLAS Madagascar',
    description: 'Reconstruction complète',
    adresse: 'Avenue du 26 Juin'
  },
  {
    id: 6,
    latitude: -18.8680,
    longitude: 47.5100,
    date: '2025-12-15',
    status: 'termine',
    surface: 120,
    budget: 4500000,
    entreprise: 'SOGEA SATOM',
    description: 'Réparation trottoir',
    adresse: 'Rue Rainitovo'
  }
];

// Utilisateurs mockés
export const mockUsers = [
  {
    id: 1,
    email: 'manager@tana.mg',
    nom: 'Rakoto',
    prenom: 'Jean',
    role: 'manager',
    blocked: false,
    createdAt: '2025-01-01'
  },
  {
    id: 2,
    email: 'user1@gmail.com',
    nom: 'Rabe',
    prenom: 'Marie',
    role: 'utilisateur',
    blocked: false,
    createdAt: '2025-06-15'
  },
  {
    id: 3,
    email: 'user2@gmail.com',
    nom: 'Randria',
    prenom: 'Paul',
    role: 'utilisateur',
    blocked: true,
    blockedReason: 'Trop de tentatives de connexion',
    createdAt: '2025-08-20'
  },
  {
    id: 4,
    email: 'user3@gmail.com',
    nom: 'Razafy',
    prenom: 'Sophie',
    role: 'utilisateur',
    blocked: true,
    blockedReason: 'Comportement suspect',
    createdAt: '2025-09-10'
  }
];

// Calcul du récapitulatif
export const calculateRecapitulatif = (signalements) => {
  const total = signalements.length;
  const totalSurface = signalements.reduce((sum, s) => sum + s.surface, 0);
  const totalBudget = signalements.reduce((sum, s) => sum + s.budget, 0);
  const termines = signalements.filter(s => s.status === 'termine').length;
  const enCours = signalements.filter(s => s.status === 'en_cours').length;
  const nouveaux = signalements.filter(s => s.status === 'nouveau').length;
  
  // Avancement: terminés = 100%, en cours = 50%, nouveaux = 0%
  const avancement = total > 0 
    ? ((termines * 100 + enCours * 50) / total).toFixed(1)
    : 0;

  return {
    nombrePoints: total,
    totalSurface,
    totalBudget,
    avancement: parseFloat(avancement),
    termines,
    enCours,
    nouveaux
  };
};

// Mock récapitulatif
export const mockRecapitulatif = calculateRecapitulatif(mockSignalements);

// Simuler un délai réseau
export const simulateDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
