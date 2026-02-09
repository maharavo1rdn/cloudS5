# Configuration Firebase Cloud Messaging (FCM) pour Android

## Problème résolu

Les notifications fonctionnent sur le navigateur mais pas dans l'APK Android car :
- Les notifications web (LocalNotifications) sont limitées aux notifications locales
- Pour les notifications push natives sur Android, il faut Firebase Cloud Messaging (FCM)

## Solution implémentée

### 1. Installation du plugin (✅ Fait)

```bash
npm install @capacitor/push-notifications@7.0.4
npx cap sync
```

### 2. Modification du service de notifications (✅ Fait)

Le `notificationService.ts` a été mis à jour pour :
- Utiliser `PushNotifications` au lieu de `LocalNotifications` sur les plateformes natives
- Sauvegarder l'état de la permission dans `Preferences` pour éviter de redemander à chaque rechargement
- Configurer les listeners natifs pour recevoir les notifications push

### 3. Configuration Firebase (⚠️ À faire manuellement)

#### a. Télécharger google-services.json

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Aller dans **Project Settings** (⚙️ en haut à gauche)
4. Dans l'onglet **General**, section **Your apps**
5. Si vous n'avez pas encore d'app Android :
   - Cliquer sur **Add app** → **Android**
   - Package name : `com.cloudS5.apk` (ou celui dans capacitor.config.ts)
   - Télécharger le fichier `google-services.json`
6. Si vous avez déjà une app Android :
   - Cliquer sur l'icône Android de votre app
   - Télécharger `google-services.json`

#### b. Placer google-services.json

```bash
# Copier le fichier téléchargé dans le dossier Android
cp google-services.json android/app/
```

#### c. Vérifier build.gradle (normalement déjà configuré par Capacitor)

Le fichier `android/build.gradle` devrait contenir :

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Le fichier `android/app/build.gradle` devrait contenir :

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

### 4. Vérification des permissions Android

Le fichier `android/app/src/main/AndroidManifest.xml` devrait contenir :

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.INTERNET" />
```

### 5. Build et test

```bash
# Rebuild l'app avec les nouvelles configurations
npx cap sync android
npx cap open android

# Dans Android Studio :
# 1. Build → Clean Project
# 2. Build → Rebuild Project
# 3. Run sur un appareil réel (les notifications push ne marchent pas sur émulateur)
```

## Comportement attendu

### Sur le navigateur
- Utilise l'API Notification web standard
- Les notifications apparaissent comme des notifications du navigateur
- ✅ Fonctionne déjà

### Sur Android (APK)
- Utilise Firebase Cloud Messaging (FCM)
- Les notifications apparaissent comme des notifications système Android natives
- 📱 Nécessite la configuration ci-dessus

## Affichage du bouton "Activer les notifications"

Le bouton n'apparaît plus à chaque rechargement grâce au système de storage :

1. Quand l'utilisateur clique sur "Activer les notifications" :
   - La permission est demandée
   - L'état est sauvegardé dans `Preferences` :
     - `notification_permission_granted`: "true" ou "false"
     - `notification_permission_asked`: "true"

2. Au chargement de la page :
   - La valeur est lue depuis `Preferences`
   - Le bouton est masqué si `notification_permission_granted === "true"`

3. Le bouton réapparaît uniquement si :
   - La permission n'a jamais été demandée
   - OU la permission a été refusée

## Fichiers modifiés

- ✅ `frontend-mobile/src/services/notificationService.ts`
  - Ajout import `PushNotifications` et `Capacitor`
  - Méthode `requestPermission()` refactorisée (natif vs web)
  - Méthode `sendSystemNotification()` refactorisée (natif vs web)
  - Ajout `setupNativeListeners()` pour Android/iOS
  - Ajout `hasPermission()` et `hasPermissionBeenAsked()` avec storage
  - Initialisation charge l'état de la permission depuis storage

- ✅ `frontend-mobile/src/pages/HomePage.vue`
  - `initializeNotifications()` utilise `await notificationService.hasPermission()`
  - Le bouton `v-if="!notificationPermissionGranted"` se base sur la valeur du storage

- ✅ `frontend-mobile/package.json`
  - Ajout `@capacitor/push-notifications@7.0.4`

## Tests

### Test navigateur
```bash
npm run dev
# Les notifications web devraient fonctionner normalement
```

### Test Android
```bash
# 1. Build l'app
npm run build

# 2. Sync avec Android
npx cap sync android

# 3. Ouvrir dans Android Studio
npx cap open android

# 4. Tester sur un appareil réel (pas émulateur)
# Les notifications push natives devraient fonctionner
```

## Dépannage

### Les notifications ne s'affichent toujours pas sur Android

1. Vérifier que `google-services.json` est bien placé dans `android/app/`
2. Vérifier les logs dans Android Studio : `Logcat` → filtrer par "FCM"
3. Vérifier que l'appareil a une connexion internet
4. Vérifier les permissions dans les paramètres de l'app Android
5. Tester sur un appareil physique (pas émulateur)

### Le bouton réapparaît à chaque rechargement

1. Vérifier que `Preferences` fonctionne :
```typescript
import { Preferences } from '@capacitor/preferences';

// Test
await Preferences.set({ key: 'test', value: 'hello' });
const { value } = await Preferences.get({ key: 'test' });
console.log(value); // Devrait afficher "hello"
```

2. Vérifier les logs console au chargement de la page

## Ressources

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Android Notification Permissions](https://developer.android.com/develop/ui/views/notifications/notification-permission)
