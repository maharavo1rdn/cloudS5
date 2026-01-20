# Script pour créer le profil manager par défaut dans Firestore

## Utiliser la console Firebase

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur "Firestore Database"
4. Cliquez sur "Démarrer une collection"
5. Nom de la collection : `users`
6. Ajoutez un document avec l'ID suivant (important d'utiliser l'UID de l'utilisateur Firebase) :

### Pour créer le manager par défaut

Après avoir créé le compte Firebase pour `user@gmail.com` (via l'interface ou l'authentification), récupérez son UID et créez un document :

**ID du document** : `[UID de l'utilisateur Firebase]`

**Champs** :
```
email: "user@gmail.com"
uid: "[même UID que l'ID du document]"
role: "manager"
createdAt: [timestamp actuel]
updatedAt: [timestamp actuel]
```

## Alternative : Utiliser un script Node.js

Si vous avez accès aux credentials Firebase Admin SDK :

```javascript
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function createManagerProfile() {
  const email = 'user@gmail.com';
  
  // Créer l'utilisateur dans Firebase Auth (si pas déjà créé)
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: 'password123',
    });
    
    // Créer le profil dans Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      uid: userRecord.uid,
      role: 'manager',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('Manager profile created successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

createManagerProfile();
```

## Note importante

Le premier login de `user@gmail.com` créera automatiquement un profil avec le rôle 'user'. Vous devrez ensuite **modifier manuellement** le champ `role` de 'user' à 'manager' dans Firestore.

### Étapes rapides :
1. Lancez l'app mobile
2. Connectez-vous avec `user@gmail.com` / `password123`
3. Allez dans Firestore Console
4. Trouvez le document créé dans la collection `users`
5. Modifiez le champ `role` : changez de `"user"` à `"manager"`
6. Sauvegardez
7. Déconnectez-vous et reconnectez-vous pour que les changements prennent effet
