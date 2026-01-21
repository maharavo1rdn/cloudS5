# Script d'Importation des Données Firebase

Ce script permet d'importer automatiquement toutes les données de test dans votre base de données Firebase.

## 📋 Prérequis

1. **Clé de service Firebase** :
   - Allez dans [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet
   - Paramètres du projet (icône ⚙️) > Comptes de service
   - "Générer une nouvelle clé privée"
   - Téléchargez le fichier JSON
   - Renommez-le `serviceAccountKey.json` et placez-le dans le dossier `scripts/`

## 🚀 Installation et Exécution

### 1. Installer les dépendances
```bash
cd scripts
npm install
```

### 2. Placer la clé de service
Placez votre fichier `serviceAccountKey.json` dans le dossier `scripts/`

### 3. Exécuter le script
```bash
npm run seed
```

## 📊 Données Importées

Le script importe automatiquement :

- **8 types de problèmes** : Nid de poule, Fissure, Affaissement, etc.
- **3 utilisateurs** : 1 manager + 2 utilisateurs normaux
- **2 entreprises** : Entreprise A et B
- **10 signalements** : Avec différents statuts (NOUVEAU, EN_COURS, TERMINE)
- **10 points géographiques** : Répartis autour d'Antananarivo

## 🔄 Après l'Importation

Une fois les données importées, modifiez `frontend-mobile/src/pages/HomePage.vue` :

### Remplacer `loadMockData()` par :

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

### Modifier les gestionnaires d'événements :

```typescript
const onFilterChange = async (event: CustomEvent) => {
  activeFilter.value = event.detail.value;
  await loadRoutes();
};

const handleReportSuccess = async () => {
  showReportModal.value = false;
  // Recharger les signalements depuis Firebase
  await loadRoutes();
};
```

## 🐛 Dépannage

### Erreur "serviceAccountKey.json not found"
- Vérifiez que le fichier est bien placé dans `scripts/`
- Vérifiez que le nom est exactement `serviceAccountKey.json`

### Erreur de permissions Firebase
- Vérifiez que votre clé de service est valide
- Vérifiez que Firestore est activé dans votre projet
- Vérifiez les règles de sécurité Firestore

### Erreur "Project not found"
- Vérifiez que l'ID du projet dans `serviceAccountKey.json` correspond à votre projet Firebase

## 📁 Structure des Données

```
Firestore Database:
├── problemes/           # Types de problèmes (8 docs)
├── users/              # Utilisateurs (3 docs)
├── entreprises/        # Entreprises (2 docs)
└── routes/             # Signalements (10 docs)
    ├── route1/
    │   └── points/     # Points géographiques
    ├── route2/
    │   └── points/
    └── ...
```

## 🎯 Test

Après l'importation, lancez l'application mobile :
- Vous devriez voir 10 marqueurs sur la carte
- Le filtre "Tous" montre tous les signalements
- Le filtre "Mes signalements" montre uniquement ceux de l'utilisateur actuel
- Les couleurs des marqueurs correspondent aux statuts