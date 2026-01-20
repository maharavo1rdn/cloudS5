# Configuration Firebase Firestore

## Configuration du projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez Firestore Database
4. Configurez les règles de sécurité :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture/écriture pour les utilisateurs authentifiés
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Permettre aux managers de lire tous les profils utilisateurs
    match /users/{userId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
  }
}
```

## Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

## Résolution des problèmes de connectivité

### Erreur "Failed to get document because the client is offline"

Cette erreur indique que Firestore ne peut pas accéder aux données. Causes possibles :

1. **Connexion réseau** : Vérifiez votre connexion internet
2. **Configuration Firebase** : Vérifiez que les clés API sont correctes
3. **Règles Firestore** : Assurez-vous que les règles permettent l'accès
4. **Projet Firebase** : Vérifiez que Firestore est activé

### Mode hors ligne

L'application inclut une gestion du mode hors ligne :
- Une bannière apparaît quand la connexion est perdue
- Les données sont stockées localement via Capacitor Preferences
- La synchronisation se fait automatiquement quand la connexion revient

### Test de la connectivité

Pour tester la connectivité Firestore :

```javascript
import authService from './services/authService';

const isConnected = await authService.checkFirestoreConnectivity();
console.log('Firestore connecté:', isConnected);
```

## Création du profil manager

Suivez les instructions dans `CREATE_MANAGER.md` pour créer le profil manager par défaut.

## Déploiement

Pour le déploiement en production :
1. Activez l'authentification Firebase
2. Configurez les règles Firestore pour la production
3. Mettez à jour les variables d'environnement
4. Testez la connectivité en conditions réelles