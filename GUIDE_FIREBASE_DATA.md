# Guide: Créer des Données de Test sur Firebase

## 1. Créer les Types de Problèmes

Dans la console Firebase > Firestore Database, créer la collection `problemes` avec ces documents :

### Document ID: `1`
```json
{
  "id": 1,
  "nom": "Nid de poule",
  "description": "Trou profond dans la chaussée"
}
```

### Document ID: `2`
```json
{
  "id": 2,
  "nom": "Fissure",
  "description": "Fissure longitudinale ou transversale"
}
```

### Document ID: `3`
```json
{
  "id": 3,
  "nom": "Affaissement",
  "description": "Affaissement de la chaussée"
}
```

### Document ID: `4`
```json
{
  "id": 4,
  "nom": "Désagrégation",
  "description": "Dégradation de la surface"
}
```

### Document ID: `5`
```json
{
  "id": 5,
  "nom": "Bosse",
  "description": "Déformation vers le haut"
}
```

### Document ID: `6`
```json
{
  "id": 6,
  "nom": "Ornière",
  "description": "Déformation en creux due au trafic"
}
```

### Document ID: `7`
```json
{
  "id": 7,
  "nom": "Éboulement",
  "description": "Effondrement de talus"
}
```

### Document ID: `8`
```json
{
  "id": 8,
  "nom": "Végétation",
  "description": "Envahissement par la végétation"
}
```

## 2. Créer des Utilisateurs de Test

Créer la collection `users` avec des utilisateurs de test :

### Document ID: `user123` (Utilisateur actuel)
```json
{
  "email": "test@example.com",
  "role": "user",
  "nom": "Dupont",
  "prenom": "Jean",
  "createdAt": "2026-01-20T10:00:00.000Z"
}
```

### Document ID: `manager123` (Manager)
```json
{
  "email": "manager@example.com",
  "role": "manager",
  "nom": "Admin",
  "prenom": "System",
  "createdAt": "2026-01-15T09:00:00.000Z"
}
```

### Document ID: `otherUser` (Autre utilisateur)
```json
{
  "email": "other@example.com",
  "role": "user",
  "nom": "Martin",
  "prenom": "Marie",
  "createdAt": "2026-01-10T08:00:00.000Z"
}
```

## 3. Créer les Entreprises

Créer la collection `entreprises` :

### Document ID: `1`
```json
{
  "id": 1,
  "nom": "Entreprise A",
  "description": "Entreprise spécialisée dans les travaux routiers"
}
```

### Document ID: `2`
```json
{
  "id": 2,
  "nom": "Entreprise B",
  "description": "Maintenance et réparation de chaussées"
}
```

## 4. Créer les Signalements (Routes)

Créer la collection `routes` avec ces signalements :

### Document ID: `route1`
```json
{
  "id": "route1",
  "user_id": "user123",
  "probleme_id": 1,
  "description": "Grand nid de poule dangereux sur la route principale",
  "superficie": 2.5,
  "statut": "NOUVEAU",
  "date_creation": "2026-01-15T14:30:00.000Z"
}
```

### Document ID: `route2`
```json
{
  "id": "route2",
  "user_id": "otherUser",
  "probleme_id": 2,
  "description": "Fissure importante nécessitant réparation urgente",
  "superficie": 5.0,
  "statut": "EN_COURS",
  "date_creation": "2026-01-12T11:15:00.000Z",
  "entreprise_id": 1
}
```

### Document ID: `route3`
```json
{
  "id": "route3",
  "user_id": "user123",
  "probleme_id": 3,
  "description": "Affaissement de la chaussée après les pluies",
  "superficie": 8.0,
  "statut": "TERMINE",
  "date_creation": "2026-01-05T09:45:00.000Z",
  "date_fin": "2026-01-18T16:20:00.000Z",
  "entreprise_id": 1
}
```

### Document ID: `route4`
```json
{
  "id": "route4",
  "user_id": "otherUser",
  "probleme_id": 4,
  "description": "Désagrégation importante de la surface",
  "superficie": 12.0,
  "statut": "NOUVEAU",
  "date_creation": "2026-01-18T13:10:00.000Z"
}
```

### Document ID: `route5`
```json
{
  "id": "route5",
  "user_id": "user123",
  "probleme_id": 5,
  "description": "Bosse créée par le trafic lourd",
  "superficie": 3.5,
  "statut": "EN_COURS",
  "date_creation": "2026-01-10T08:30:00.000Z",
  "entreprise_id": 2
}
```

### Document ID: `route6`
```json
{
  "id": "route6",
  "user_id": "otherUser",
  "probleme_id": 6,
  "description": "Ornière profonde suite au passage des camions",
  "superficie": 15.0,
  "statut": "NOUVEAU",
  "date_creation": "2026-01-19T15:45:00.000Z"
}
```

### Document ID: `route7`
```json
{
  "id": "route7",
  "user_id": "user123",
  "probleme_id": 7,
  "description": "Éboulement du talus après fortes pluies",
  "superficie": 20.0,
  "statut": "EN_COURS",
  "date_creation": "2026-01-08T12:00:00.000Z",
  "entreprise_id": 1
}
```

### Document ID: `route8`
```json
{
  "id": "route8",
  "user_id": "otherUser",
  "probleme_id": 8,
  "description": "Végétation envahissant la chaussée",
  "superficie": 6.0,
  "statut": "TERMINE",
  "date_creation": "2026-01-03T10:15:00.000Z",
  "date_fin": "2026-01-16T14:30:00.000Z",
  "entreprise_id": 2
}
```

### Document ID: `route9`
```json
{
  "id": "route9",
  "user_id": "user123",
  "probleme_id": 1,
  "description": "Série de petits nids de poule",
  "superficie": 4.0,
  "statut": "NOUVEAU",
  "date_creation": "2026-01-20T09:20:00.000Z"
}
```

### Document ID: `route10`
```json
{
  "id": "route10",
  "user_id": "otherUser",
  "probleme_id": 2,
  "description": "Fissures en étoile au centre de la route",
  "superficie": 3.0,
  "statut": "TERMINE",
  "date_creation": "2026-01-01T11:30:00.000Z",
  "date_fin": "2026-01-14T13:45:00.000Z",
  "entreprise_id": 1
}
```

## 5. Créer les Points des Routes

Créer des sous-collections `points` pour chaque route :

### Route 1 - Point (Document ID: `point1`)
Collection: `routes/route1/points`
```json
{
  "id": "point1",
  "route_id": "route1",
  "latitude": -18.8792,
  "longitude": 47.5079,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 2 - Point (Document ID: `point2`)
Collection: `routes/route2/points`
```json
{
  "id": "point2",
  "route_id": "route2",
  "latitude": -18.8850,
  "longitude": 47.5150,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 3 - Point (Document ID: `point3`)
Collection: `routes/route3/points`
```json
{
  "id": "point3",
  "route_id": "route3",
  "latitude": -18.8700,
  "longitude": 47.5000,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 4 - Point (Document ID: `point4`)
Collection: `routes/route4/points`
```json
{
  "id": "point4",
  "route_id": "route4",
  "latitude": -18.8950,
  "longitude": 47.5200,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 5 - Point (Document ID: `point5`)
Collection: `routes/route5/points`
```json
{
  "id": "point5",
  "route_id": "route5",
  "latitude": -18.8650,
  "longitude": 47.5250,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 6 - Point (Document ID: `point6`)
Collection: `routes/route6/points`
```json
{
  "id": "point6",
  "route_id": "route6",
  "latitude": -18.9000,
  "longitude": 47.5100,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 7 - Point (Document ID: `point7`)
Collection: `routes/route7/points`
```json
{
  "id": "point7",
  "route_id": "route7",
  "latitude": -18.8600,
  "longitude": 47.4950,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 8 - Point (Document ID: `point8`)
Collection: `routes/route8/points`
```json
{
  "id": "point8",
  "route_id": "route8",
  "latitude": -18.8750,
  "longitude": 47.5300,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 9 - Point (Document ID: `point9`)
Collection: `routes/route9/points`
```json
{
  "id": "point9",
  "route_id": "route9",
  "latitude": -18.8900,
  "longitude": 47.5050,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

### Route 10 - Point (Document ID: `point10`)
Collection: `routes/route10/points`
```json
{
  "id": "point10",
  "route_id": "route10",
  "latitude": -18.8820,
  "longitude": 47.4980,
  "ordre": 1,
  "point_statut": "ACTIF"
}
```

## 6. Modifier le Code pour Utiliser Firebase

Une fois les données créées dans Firebase, modifiez `HomePage.vue` :

### Remplacer la fonction `loadMockData` par :

```typescript
// Charger les signalements depuis Firebase
const loadRoutes = async () => {
  try {
    if (activeFilter.value === 'mine') {
      routes.value = await routeService.getUserRoutes();
    } else {
      routes.value = await routeService.getAllRoutes();
    }
    
    // Afficher les marqueurs sur la carte
    displayRouteMarkers();
  } catch (error) {
    console.error('Erreur lors du chargement des signalements:', error);
  }
};
```

### Modifier `onMounted` :

```typescript
// Initialiser la carte
initMap();

// Charger les signalements depuis Firebase
await loadRoutes();
```

### Modifier `onFilterChange` :

```typescript
const onFilterChange = async (event: CustomEvent) => {
  activeFilter.value = event.detail.value;
  await loadRoutes();
};
```

### Modifier `handleReportSuccess` :

```typescript
const handleReportSuccess = async () => {
  showReportModal.value = false;
  // Recharger les signalements depuis Firebase
  await loadRoutes();
};
```

## 7. Script Automatique (Optionnel)

Vous pouvez créer un script Node.js pour importer automatiquement ces données :

```javascript
// scripts/seedFirebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Vos données ici...
// Puis exécuter avec: node scripts/seedFirebase.js
```

## Résumé

Après avoir créé toutes ces données dans Firebase :
- ✅ 8 types de problèmes
- ✅ 3 utilisateurs (1 manager, 2 users)
- ✅ 2 entreprises
- ✅ 10 signalements avec différents statuts
- ✅ 10 points géographiques

L'application chargera automatiquement ces données depuis Firebase au lieu des données statiques !