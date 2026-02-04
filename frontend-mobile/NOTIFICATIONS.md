# Système de Notifications - Architecture Hybride

## Architecture

Le système de notifications utilise une **architecture hybride** pour assurer la synchronisation multi-appareils et les performances :

1. **Firestore** : Source de vérité (collection `notifications`)
2. **Capacitor LocalNotifications** : Notifications push natives (système)
3. **Capacitor Preferences** : Cache local pour les performances
4. **Firestore onSnapshot** : Détection en temps réel des changements

## Flux de données

```
Changement Point Firestore
  ↓
Listener onSnapshot détecte
  ↓
Création document Firestore /notifications/
  ↓
Listener notifications détecte ← Synchronisation multi-appareils
  ↓
Ajout au cache local (Preferences)
  ↓
Envoi notification push système (LocalNotifications)
```

## Structure Firestore

### Collection `notifications`

```typescript
{
  id: string,                    // Auto-généré par Firestore
  userId: string,                // ID de l'utilisateur concerné
  routeId: string,               // ID du signalement
  routeName: string,             // Nom du signalement
  type: 'status_change',         // Type de notification
  title: string,                 // "🔄 Changement de statut"
  body: string,                  // Description du changement
  newStatus: string,             // Nouveau statut
  oldStatus?: string,            // Ancien statut (optionnel)
  createdAt: Timestamp,          // Date de création
  read: boolean                  // Lu/Non lu
}
```

### Règles de sécurité

```javascript
match /notifications/{notificationId} {
  // Lecture : uniquement ses propres notifications
  allow read: if request.auth != null && 
                 resource.data.userId == request.auth.uid;
  
  // Création : uniquement pour soi-même
  allow create: if request.auth != null && 
                   request.resource.data.userId == request.auth.uid;
  
  // Mise à jour : uniquement ses propres notifications
  allow update: if request.auth != null && 
                   resource.data.userId == request.auth.uid;
  
  // Suppression : uniquement ses propres notifications
  allow delete: if request.auth != null && 
                   resource.data.userId == request.auth.uid;
}
```

## Fonctionnement

### 1. Initialisation

Au lancement de l'app :

```typescript
await notificationService.initialize(userId);
```

Cela déclenche :
1. Demande de permission pour notifications système
2. Chargement de la dernière date de vérification
3. **Synchronisation avec Firestore** (charge les 50 dernières notifications)
4. Mise à jour du cache local
5. Démarrage des listeners temps réel

### 2. Double écoute en temps réel

#### A. Listener sur la collection `points`

```typescript
const pointsRef = collection(db, 'points');
const q = query(pointsRef, where('created_by', '==', userId));

this.unsubscribePoints = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'modified') {
      // Créer notification dans Firestore
      await addDoc(collection(db, 'notifications'), {...});
    }
  });
});
```

#### B. Listener sur la collection `notifications`

```typescript
const notificationsRef = collection(db, 'notifications');
const q = query(
  notificationsRef,
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(50)
);

this.unsubscribeNotifications = onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      // Ajouter au cache local
      // Envoyer push système
    }
  });
});
```

### 3. Création de notification

Lorsqu'un changement de statut est détecté :

```typescript
// Créer dans Firestore (source de vérité)
const notificationsRef = collection(db, 'notifications');
await addDoc(notificationsRef, {
  userId,
  routeId,
  routeName: routeData.nom,
  type: 'status_change',
  title: '🔄 Changement de statut',
  body: `"${routeData.nom}" est maintenant "${statusLabel}"`,
  newStatus: routeData.point_statut,
  createdAt: Timestamp.fromDate(updatedAt),
  read: false
});

// Le listener Firestore s'occupe du reste :
// - Ajout au cache local (Preferences)
// - Envoi de la notification push système
```

### 4. Notification push système

```typescript
await LocalNotifications.schedule({
  notifications: [
    {
      title: notification.title,
      body: notification.body,
      id: notificationId,
      schedule: { at: new Date(Date.now() + 1000) },
      extra: { routeId, type, notificationId }
    }
  ]
});
```

## Synchronisation multi-appareils

Grâce à Firestore, les notifications sont synchronisées entre tous les appareils :

- **Appareil A** : Reçoit une notification de changement de statut
- **Appareil B** : Reçoit la même notification en temps réel via Firestore
- **Marquer comme lu sur A** : Mis à jour sur B instantanément
- **Supprimer sur B** : Supprimé sur A instantanément

## API du Service

### `initialize(userId: string)`

Initialise le service pour un utilisateur donné.
- Demande les permissions
- Synchronise avec Firestore
- Démarre les listeners temps réel

### `getNotifications(): Promise<Notification[]>`

Retourne toutes les notifications du cache local.

### `getUnreadCount(): number`

Retourne le nombre de notifications non lues.

### `markAsRead(notificationId: string)`

Marque une notification comme lue.
- ✅ Mise à jour Firestore
- ✅ Mise à jour cache local
- ✅ Synchronisation multi-appareils

### `markAllAsRead()`

Marque toutes les notifications comme lues.
- ✅ Mise à jour batch Firestore
- ✅ Mise à jour cache local
- ✅ Synchronisation multi-appareils

### `deleteNotification(notificationId: string)`

Supprime une notification.
- ✅ Suppression Firestore
- ✅ Suppression cache local
- ✅ Synchronisation multi-appareils

### `clearAll()`

Supprime toutes les notifications.
- ✅ Suppression batch Firestore
- ✅ Vidage cache local
- ✅ Synchronisation multi-appareils

### `updateLastCheckDate()`

Met à jour la date de dernière consultation (stockée localement).

### `checkForChanges(userId: string): Promise<number>`

Force une vérification manuelle des changements. Retourne le nombre de nouvelles notifications.

### `cleanup()`

Nettoie le service (à appeler lors du logout).
- Arrête les listeners Firestore
- Libère les ressources

## Stockage

### 1. Firestore (source de vérité)

**Collection** : `notifications`

**Index requis** :
- `userId` ASC + `createdAt` DESC

**Avantages** :
- ✅ Synchronisation multi-appareils
- ✅ Persistance cloud
- ✅ Temps réel
- ✅ Sécurisé (règles d'accès)

### 2. Preferences (cache local)

- `last_notification_check` : Timestamp de la dernière vérification
- `notifications` : Array JSON des notifications (cache)

**Avantages** :
- ✅ Accès ultra-rapide
- ✅ Fonctionne hors ligne
- ✅ Réduit les lectures Firestore

### Structure d'une notification

```typescript
interface Notification {
  id: string;                    // Auto-généré par Firestore
  userId: string;                // Propriétaire
  routeId: string;               // Signalement concerné
  routeName: string;             // Nom du signalement
  type: 'status_change';         // Type
  title: string;                 // Titre court
  body: string;                  // Description
  oldStatus?: string;            // Ancien statut (optionnel)
  newStatus?: string;            // Nouveau statut
  createdAt: Date;               // Date de création
  read: boolean;                 // Lu/Non lu
}
```

## Avantages de cette architecture

### 1. Synchronisation multi-appareils ✅

- Téléphone personnel
- Tablette
- Navigateur web

Toutes les notifications sont synchronisées en temps réel.

### 2. Performance optimale ✅

- **Lectures Firestore** : Minimisées grâce au cache local
- **Accès rapide** : Preferences pour l'affichage
- **Temps réel** : onSnapshot pour les mises à jour

### 3. Robustesse ✅

- **Fallback automatique** : Si Firestore échoue → cache local
- **Gestion d'erreurs** : Toutes les opérations ont un fallback local
- **Offline-first** : Fonctionne sans connexion (lecture seule)

### 4. Sécurité ✅

- Règles Firestore strictes (accès uniquement à ses propres notifications)
- Validation côté serveur via règles
- Pas de données sensibles exposées

## Test

### 1. Tester la synchronisation

**Étape 1** : Ouvrir l'app sur appareil A
```typescript
await notificationService.initialize(userId);
```

**Étape 2** : Changer un statut dans Firestore Console

**Étape 3** : Vérifier :
- ✅ Notification push système sur A
- ✅ Badge +1 sur A
- ✅ Visible dans le modal sur A

**Étape 4** : Ouvrir l'app sur appareil B avec le même userId
- ✅ La notification apparaît automatiquement sur B

**Étape 5** : Marquer comme lu sur B
- ✅ Marquée comme lue sur A instantanément

### 2. Créer un changement de statut manuellement

**Console Firestore** :
1. Collection `points`
2. Modifier `point_statut` (ex: `NOUVEAU` → `EN_COURS`)
3. Mettre à jour `updated_at` avec `serverTimestamp()`

**Ou via code** :
```typescript
const pointRef = doc(db, 'points', routeId);
await updateDoc(pointRef, {
  point_statut: 'EN_COURS',
  updated_at: serverTimestamp()
});
```

### 3. Vérifier les règles de sécurité

Déployer les règles :
```bash
firebase deploy --only firestore:rules
```

## Déploiement des règles Firestore

```bash
# Fichier : firestore.rules à la racine
firebase deploy --only firestore:rules
```

## Limitations actuelles

- ⚠️ Les notifications push natives ne fonctionnent que lorsque l'app est **ouverte ou en arrière-plan récent**
- ⚠️ Pour les notifications quand l'app est complètement fermée, il faut **Firebase Cloud Messaging (FCM)**

## Évolution future : FCM pour background push

Pour avoir des notifications même quand l'app est fermée :

### 1. Cloud Function (backend)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.onNotificationCreated = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();
    
    // Récupérer le token FCM de l'utilisateur
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(notification.userId)
      .get();
    
    const fcmToken = userDoc.data().fcmToken;
    
    if (fcmToken) {
      // Envoyer push FCM
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          routeId: notification.routeId,
          notificationId: snapshot.id
        }
      });
    }
  });
```

### 2. Frontend : Enregistrement FCM

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Demander permission et récupérer token
const { receive } = await PushNotifications.addListener('registration', 
  async (token) => {
    // Sauvegarder le token dans Firestore
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token.value
    });
  }
);

await PushNotifications.register();
```

## Résumé de l'architecture

```
┌─────────────────────────────────────────────────┐
│           ARCHITECTURE HYBRIDE                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐        ┌──────────────┐      │
│  │   Firestore  │◄──────►│  Appareil A  │      │
│  │ notifications│        │  (cache +    │      │
│  │  (source de  │        │   push)      │      │
│  │    vérité)   │        └──────────────┘      │
│  └──────┬───────┘                               │
│         │                                        │
│         │ Temps réel                             │
│         ▼                                        │
│  ┌──────────────┐                               │
│  │  Appareil B  │                               │
│  │  (cache +    │                               │
│  │   push)      │                               │
│  └──────────────┘                               │
│                                                  │
│  ✅ Synchronisation multi-appareils             │
│  ✅ Cache local (Preferences)                   │
│  ✅ Push natifs (LocalNotifications)            │
│  ✅ Temps réel (onSnapshot)                     │
│  ✅ Sécurisé (règles Firestore)                 │
│                                                  │
└─────────────────────────────────────────────────┘
```
