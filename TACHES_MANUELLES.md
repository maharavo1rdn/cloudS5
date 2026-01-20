# Tâches Manuelles Requises

Ce document liste toutes les tâches qui ne peuvent pas être automatisées par le code et nécessitent une configuration manuelle.

## 1. Configuration Firebase

### 1.1 Créer un Projet Firebase
1. Aller sur https://console.firebase.google.com/
2. Cliquer sur "Ajouter un projet"
3. Nommer le projet (ex: "CloudS5")
4. Activer/Désactiver Google Analytics selon vos besoins
5. Créer le projet

### 1.2 Activer l'Authentification Firebase
1. Dans la console Firebase, aller dans "Authentication"
2. Cliquer sur "Commencer"
3. Dans l'onglet "Sign-in method":
   - Activer "Email/Password"
   - Cocher "Activer" et "Enregistrer"

### 1.3 Créer Cloud Firestore
1. Dans la console Firebase, aller dans "Firestore Database"
2. Cliquer sur "Créer une base de données"
3. Choisir le mode:
   - **Mode test** (pour développement - accès ouvert pendant 30 jours)
   - **Mode production** (avec règles de sécurité - recommandé)
4. Choisir l'emplacement (ex: europe-west)
5. Créer la base de données

### 1.4 Configurer les Règles Firestore

Remplacer les règles par défaut par ces règles de sécurité:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fonction helper pour vérifier si l'utilisateur est manager
    function isManager() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
    
    // Fonction helper pour vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Collection users
    match /users/{userId} {
      // Lecture: uniquement par l'utilisateur lui-même ou un manager
      allow read: if isAuthenticated() && (request.auth.uid == userId || isManager());
      
      // Création: uniquement par les managers
      allow create: if isManager();
      
      // Mise à jour: uniquement par l'utilisateur lui-même ou un manager
      allow update: if isAuthenticated() && (request.auth.uid == userId || isManager());
      
      // Suppression: uniquement par les managers
      allow delete: if isManager();
    }
    
    // Collection problemes (types de problèmes routiers)
    match /problemes/{problemeId} {
      // Lecture: tous les utilisateurs authentifiés
      allow read: if isAuthenticated();
      
      // Écriture: uniquement les managers (pour initialiser)
      allow write: if isManager();
    }
    
    // Collection routes (signalements)
    match /routes/{routeId} {
      // Lecture: tous les utilisateurs authentifiés
      allow read: if isAuthenticated();
      
      // Création: tous les utilisateurs authentifiés
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.user_id;
      
      // Mise à jour: créateur du signalement ou manager
      allow update: if isAuthenticated() && 
                       (request.auth.uid == resource.data.user_id || isManager());
      
      // Suppression: créateur du signalement ou manager
      allow delete: if isAuthenticated() && 
                       (request.auth.uid == resource.data.user_id || isManager());
    }
    
    // Collection route_points (sous-collection de routes)
    match /routes/{routeId}/points/{pointId} {
      // Lecture: tous les utilisateurs authentifiés
      allow read: if isAuthenticated();
      
      // Écriture: créateur de la route ou manager
      allow write: if isAuthenticated() && 
                      (request.auth.uid == get(/databases/$(database)/documents/routes/$(routeId)).data.user_id || 
                       isManager());
    }
    
    // Collection entreprises
    match /entreprises/{entrepriseId} {
      // Lecture: tous les utilisateurs authentifiés
      allow read: if isAuthenticated();
      
      // Écriture: uniquement les managers
      allow write: if isManager();
    }
  }
}
```

### 1.5 Obtenir la Configuration Firebase
1. Dans la console Firebase, aller dans "Paramètres du projet" (icône engrenage)
2. Dans l'onglet "Général", descendre jusqu'à "Vos applications"
3. Cliquer sur l'icône Web (</>) pour créer une application web
4. Donner un nom à l'application (ex: "CloudS5 Mobile")
5. Ne pas cocher "Firebase Hosting"
6. Cliquer sur "Enregistrer l'application"
7. **Copier la configuration `firebaseConfig`**

### 1.6 Mettre à Jour le Fichier de Configuration

Ouvrir `frontend-mobile/src/config/firebase.ts` et remplacer les valeurs placeholder par votre configuration Firebase:

```typescript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

## 2. Créer le Premier Manager

### Option A: Via la Console Firebase (Recommandé)

1. **Créer l'utilisateur dans Authentication:**
   - Aller dans "Authentication" > "Users"
   - Cliquer sur "Ajouter un utilisateur"
   - Email: `admin@gmail.com` (ou votre email)
   - Mot de passe: créer un mot de passe sécurisé
   - Cliquer sur "Ajouter un utilisateur"
   - **Noter l'UID de l'utilisateur créé**

2. **Créer le profil Firestore:**
   - Aller dans "Firestore Database"
   - Cliquer sur "Démarrer une collection"
   - ID de collection: `users`
   - Cliquer sur "Suivant"
   - ID du document: **utiliser l'UID noté à l'étape précédente**
   - Ajouter les champs suivants:
     - `email` (string): `admin@gmail.com`
     - `role` (string): `manager`
     - `nom` (string): `Admin`
     - `prenom` (string): `System`
     - `createdAt` (timestamp): cliquer sur l'icône horloge et sélectionner "Maintenant"
   - Cliquer sur "Enregistrer"

### Option B: Via l'Application Mobile

1. Modifier temporairement `RegisterUserModal.vue` pour permettre l'auto-inscription du premier manager
2. S'inscrire via l'application
3. Aller dans Firestore et modifier manuellement le champ `role` de `user` à `manager`
4. Remettre `RegisterUserModal.vue` en mode manager-only

## 3. Initialiser les Types de Problèmes

Une fois le premier manager créé et connecté:

1. Se connecter à l'application avec le compte manager
2. Les types de problèmes par défaut seront automatiquement créés au premier chargement de la page d'accueil

**Ou manuellement dans Firestore:**

Créer une collection `problemes` avec ces documents:

| ID | nom | description |
|----|-----|-------------|
| 1 | Nid de poule | Trou profond dans la chaussée |
| 2 | Fissure | Fissure longitudinale ou transversale |
| 3 | Affaissement | Affaissement de la chaussée |
| 4 | Désagrégation | Dégradation de la surface |
| 5 | Bosse | Déformation vers le haut |
| 6 | Ornière | Déformation en creux due au trafic |
| 7 | Éboulement | Effondrement de talus |
| 8 | Végétation | Envahissement par la végétation |

Chaque document doit avoir:
- `id` (number): le numéro
- `nom` (string): le nom du problème
- `description` (string): la description

## 4. Configuration du Backend (PostgreSQL)

Les tables PostgreSQL ont déjà été créées via les scripts SQL, mais vérifier:

1. Le conteneur PostgreSQL est en cours d'exécution:
   ```bash
   docker ps | grep postgres
   ```

2. Les tables existent:
   ```bash
   docker exec -it cloudS5-postgres-1 psql -U cloudS5_user -d cloudS5_db -c "\dt"
   ```

3. Les rôles par défaut existent:
   ```bash
   docker exec -it cloudS5-postgres-1 psql -U cloudS5_user -d cloudS5_db -c "SELECT * FROM roles;"
   ```

4. L'utilisateur admin existe:
   ```bash
   docker exec -it cloudS5-postgres-1 psql -U cloudS5_user -d cloudS5_db -c "SELECT * FROM users;"
   ```

## 5. Test du Système

### Vérifier l'Authentification
1. Lancer l'application mobile
2. Se connecter avec le compte manager (`admin@gmail.com`)
3. Vérifier que le bouton "Ajouter utilisateur" (icône personne avec +) est visible dans la barre d'outils

### Vérifier la Création d'Utilisateurs
1. Cliquer sur le bouton "Ajouter utilisateur"
2. Créer un utilisateur avec le rôle "user"
3. Se déconnecter
4. Se connecter avec le nouvel utilisateur
5. Vérifier que le bouton "Ajouter utilisateur" n'est PAS visible

### Vérifier les Signalements
1. Se connecter avec un utilisateur
2. Cliquer sur le bouton "+" en bas à droite de la carte
3. Remplir le formulaire de signalement
4. Vérifier qu'un marqueur rouge apparaît sur la carte
5. Utiliser le filtre "Mes signalements" pour filtrer

## 6. Localisation du Bouton "Ajouter Utilisateur"

**Le bouton est déjà implémenté dans l'application!**

📍 **Emplacement:** `frontend-mobile/src/pages/HomePage.vue` - lignes 6-9

Le bouton apparaît dans la barre d'outils (toolbar) en haut de l'écran:
- **Icône:** Personne avec un "+" (personAdd)
- **Visibilité:** Uniquement si l'utilisateur connecté est un manager
- **Action:** Ouvre le modal `RegisterUserModal.vue` pour créer un nouvel utilisateur

```vue
<ion-button v-if="isManager" @click="openRegisterModal">
  <ion-icon :icon="personAdd"></ion-icon>
</ion-button>
```

## Résumé des Tâches

✅ **Code déjà implémenté:**
- Tous les services (auth, user, route)
- Tous les composants (modals, pages)
- Toutes les interfaces TypeScript
- Système de filtrage des signalements
- Affichage des marqueurs sur la carte
- Bouton d'ajout d'utilisateur (visible uniquement pour managers)

❌ **Configuration manuelle requise:**
1. Créer le projet Firebase
2. Activer Authentication (Email/Password)
3. Créer Cloud Firestore
4. Configurer les règles de sécurité Firestore
5. Obtenir et configurer firebaseConfig
6. Créer le premier utilisateur manager
7. Initialiser les types de problèmes (automatique au premier lancement)
8. Tester le système

**Temps estimé:** 15-20 minutes
