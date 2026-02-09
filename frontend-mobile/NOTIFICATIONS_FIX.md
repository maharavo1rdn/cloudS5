# 🔔 RÉSOLUTION DU PROBLÈME DE NOTIFICATIONS

## 📋 Résumé des problèmes et solutions

### Problème 1 : Les notifications ne fonctionnent pas dans l'APK Android
**Cause** : LocalNotifications ne fonctionne que pour les notifications locales déclenchées par l'app elle-même, pas pour les notifications push natives.

**✅ Solution implémentée** :
- Installation de `@capacitor/push-notifications@7.0.4`
- Refactoring du service de notifications pour utiliser PushNotifications sur Android
- Configuration des listeners natifs pour recevoir les notifications

**⚠️ Action manuelle requise** :
Il faut télécharger le fichier `google-services.json` depuis Firebase Console et le placer dans `android/app/`

Voir les instructions détaillées dans [FCM_CONFIG.md](./FCM_CONFIG.md)

### Problème 2 : Le bouton "Activer les notifications" apparaît à chaque rechargement
**Cause** : L'état de la permission n'était pas sauvegardé de manière persistante.

**✅ Solution implémentée** :
- Sauvegarde de l'état de la permission dans `Preferences` (storage persistant Capacitor)
- Chargement de l'état au démarrage de l'app
- Le bouton est automatiquement masqué si la permission a déjà été accordée

## 🛠️ Modifications effectuées

### 1. Service de notifications (`src/services/notificationService.ts`)

#### Imports mis à jour
```typescript
// Avant
import { LocalNotifications } from '@capacitor/local-notifications';

// Après
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
```

#### Méthode `requestPermission()` refactorisée
- Détecte automatiquement si on est sur plateforme native (Android/iOS) ou web
- Utilise `PushNotifications` sur natif, `Notification API` sur web
- Sauvegarde l'état dans `Preferences` :
  - `notification_permission_granted`: "true" ou "false"
  - `notification_permission_asked`: "true"

#### Méthode `sendSystemNotification()` refactorisée
- Sur web : utilise `new Notification()` (API navigateur)
- Sur natif : enregistré pour FCM (les notifications viendront du serveur Firebase)

#### Nouvelles méthodes
```typescript
setupNativeListeners()         // Configure les listeners Android/iOS
hasPermission(): Promise<boolean>      // Lit l'état depuis storage
hasPermissionBeenAsked(): Promise<boolean>  // Vérifie si déjà demandé
```

### 2. Page d'accueil (`src/pages/HomePage.vue`)

#### Fonction `initializeNotifications()` mise à jour
```typescript
// Avant
notificationPermissionGranted.value = notificationService.hasPermission();

// Après
notificationPermissionGranted.value = await notificationService.hasPermission();
```

Maintenant lit la valeur depuis le storage au lieu de la variable en mémoire.

### 3. Package.json
```json
{
  "@capacitor/push-notifications": "7.0.4"
}
```

### 4. Synchronisation Capacitor
```bash
npx cap sync
```
- Le plugin `@capacitor/push-notifications` est maintenant enregistré sur Android
- Prêt à recevoir des notifications push natives

## 📱 Étapes pour tester

### Sur le navigateur (déjà fonctionnel)
```bash
npm run dev
```
1. Ouvrir l'app dans le navigateur
2. Cliquer sur "Activer les notifications"
3. Accorder la permission
4. Recharger la page → le bouton ne devrait plus apparaître ✅
5. Créer un signalement et changer son statut → notification web reçue ✅

### Sur Android (nécessite configuration FCM)

#### Étape 1 : Télécharger google-services.json
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Settings (⚙️) → Project Settings
4. Onglet **General** → section **Your apps**
5. Ajouter une app Android (si pas déjà fait) :
   - Package name: `io.ionic.starter`
   - Download `google-services.json`

#### Étape 2 : Placer le fichier
```bash
cp ~/Downloads/google-services.json frontend-mobile/android/app/
```

#### Étape 3 : Build et déployer
```bash
cd frontend-mobile

# Build l'app web
npm run build

# Synchroniser avec Android
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

#### Étape 4 : Tester dans Android Studio
1. Build → Clean Project
2. Build → Rebuild Project
3. Run sur un **appareil physique** (pas émulateur, les push ne marchent pas sur émulateur)
4. Dans l'app :
   - Cliquer sur "Activer les notifications"
   - Accorder la permission
   - Fermer et rouvrir l'app → le bouton ne devrait plus apparaître ✅
   - Créer un signalement et changer son statut
   - Vérifier que la notification Android native apparaît ✅

## 🔍 Vérification des logs

### Dans le navigateur (F12 Console)
```
🔔 Initialisation du service de notifications pour user: <userId>
✅ Permission notifications web: granted
📥 Nouvelle notification ajoutée: 🔄 Changement de statut
📱 Notification web envoyée: 🔄 Changement de statut
```

### Dans Android Studio (Logcat)
Filtrer par "FCM" ou "PushNotifications" :
```
I/PushNotifications: Push notification token: <token>
I/FirebaseMessaging: FCM token registered
D/NotificationService: 📥 Notification reçue (foreground)
```

## 📄 Fichiers de documentation

- [FCM_CONFIG.md](./FCM_CONFIG.md) - Configuration détaillée Firebase Cloud Messaging
- [NOTIFICATIONS.md](./NOTIFICATIONS.md) - Architecture complète du système de notifications

## ✅ Checklist de vérification

### Environnement de développement
- [x] Package `@capacitor/push-notifications` installé
- [x] Service de notifications refactoré (PushNotifications + storage)
- [x] HomePage mise à jour (chargement depuis storage)
- [x] Build réussi sans erreurs TypeScript
- [x] `npx cap sync` exécuté avec succès

### Configuration Firebase (à faire manuellement)
- [ ] `google-services.json` téléchargé depuis Firebase Console
- [ ] Fichier placé dans `android/app/google-services.json`
- [ ] Build Android réussi dans Android Studio
- [ ] Test sur appareil physique (pas émulateur)

### Tests fonctionnels
- [ ] Navigateur : bouton disparaît après accord de permission
- [ ] Navigateur : notifications web fonctionnent
- [ ] Android : bouton disparaît après accord de permission
- [ ] Android : notifications natives Android fonctionnent

## 🆘 Dépannage

### Le bouton réapparaît toujours
```typescript
// Test dans la console navigateur
import { Preferences } from '@capacitor/preferences';
const { value } = await Preferences.get({ key: 'notification_permission_granted' });
console.log('Permission:', value); // Devrait être "true" après accord
```

### Notifications Android ne fonctionnent pas
1. Vérifier `google-services.json` existe dans `android/app/`
2. Clean & Rebuild dans Android Studio
3. Vérifier les logs Logcat (filtre "FCM")
4. Tester sur **appareil physique** (les émulateurs ont des limitations)
5. Vérifier permissions dans Settings → Apps → Votre App → Notifications

## 📊 Architecture finale

```
┌─────────────────────────────────────────────────┐
│           Changement statut Point               │
│         (utilisateur modifie un point)          │
└─────────────────┬───────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────┐
│     Firestore Listener (onSnapshot points)      │
│         détecte le changement                   │
└─────────────────┬───────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────┐
│   Création document dans /notifications/        │
│    (Firestore - source de vérité)              │
└─────────────────┬───────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────┐
│  Firestore Listener (onSnapshot notifications)  │
│     synchronisation multi-appareils             │
└──────────┬──────────────────────┬────────────────┘
           ▼                      ▼
    ┌──────────────┐      ┌─────────────────┐
    │ Cache local  │      │   Notification  │
    │ (Preferences)│      │     système     │
    └──────────────┘      └─────────────────┘
                                   ▼
                          ┌─────────────────┐
                          │  WEB: browser   │
                          │  Notification   │
                          │                 │
                          │ ANDROID: FCM    │
                          │  native notif   │
                          └─────────────────┘
```

## 🎯 Résultat attendu

✅ **Sur navigateur** : Notifications web natives + bouton masqué après accord
✅ **Sur Android APK** : Notifications Android natives + bouton masqué après accord
✅ **Persistance** : Permission sauvegardée entre les sessions
✅ **Multi-appareils** : Synchronisation via Firestore

---

**Date de mise à jour** : 9 février 2026
**Version** : 1.0
