# Guide d'initialisation du projet CloudS5 Road Works

## 📦 Installation des dépendances

### Bibliothèques nécessaires

```bash
# Bibliothèque de cartes (choisir une des deux)
npm install leaflet @types/leaflet
# OU
npm install mapbox-gl @types/mapbox-gl

# Capacitor pour les fonctionnalités natives
npm install @capacitor/geolocation @capacitor/camera @capacitor/storage

# Utilitaires
npm install date-fns
```

### Configuration Ionic (si pas déjà fait)

Vérifiez que votre `ionic.config.json` est configuré :

```json
{
  "name": "CloudS5",
  "integrations": {
    "capacitor": {}
  },
  "type": "vue"
}
```

## 🎨 Configuration du thème noir & blanc

Créez/modifiez le fichier `src/theme/variables.css` :

```css
:root {
  /* Couleurs principales */
  --ion-color-primary: #000000;
  --ion-color-primary-rgb: 0, 0, 0;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #1a1a1a;
  --ion-color-primary-tint: #2a2a2a;

  --ion-color-secondary: #424242;
  --ion-color-secondary-rgb: 66, 66, 66;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-secondary-contrast-rgb: 255, 255, 255;
  --ion-color-secondary-shade: #3a3a3a;
  --ion-color-secondary-tint: #555555;

  --ion-color-tertiary: #9e9e9e;
  --ion-color-tertiary-rgb: 158, 158, 158;
  --ion-color-tertiary-contrast: #000000;
  --ion-color-tertiary-contrast-rgb: 0, 0, 0;
  --ion-color-tertiary-shade: #8b8b8b;
  --ion-color-tertiary-tint: #a8a8a8;

  /* Backgrounds */
  --ion-background-color: #ffffff;
  --ion-background-color-rgb: 255, 255, 255;

  --ion-text-color: #000000;
  --ion-text-color-rgb: 0, 0, 0;

  --ion-border-color: #e0e0e0;
  --ion-card-background: #ffffff;
}

/* Mode sombre (optionnel) */
@media (prefers-color-scheme: dark) {
  :root {
    --ion-background-color: #000000;
    --ion-background-color-rgb: 0, 0, 0;
    --ion-text-color: #ffffff;
    --ion-text-color-rgb: 255, 255, 255;
    --ion-border-color: #2a2a2a;
    --ion-card-background: #1a1a1a;
  }
}
```

## 📂 Structure des dossiers recommandée

```
src/
├── components/
│   ├── common/          # Composants réutilisables
│   │   ├── Card.vue
│   │   ├── Button.vue
│   │   └── Badge.vue
│   ├── forms/           # Formulaires
│   │   └── LoginForm.vue
│   └── roadworks/       # Composants spécifiques
│       ├── RoadWorkCard.vue
│       ├── RoadWorkMap.vue
│       └── RoadWorkFilters.vue
├── views/               # Pages
│   ├── auth/
│   │   └── LoginPage.vue
│   ├── home/
│   │   └── HomePage.vue
│   ├── roadworks/
│   │   ├── RoadWorksList.vue
│   │   ├── RoadWorkDetail.vue
│   │   └── RoadWorkMap.vue
│   └── profile/
│       └── ProfilePage.vue
├── services/            # Services API
│   ├── auth.service.ts
│   └── roadworks.service.ts
├── types/               # Types TypeScript
│   └── index.ts
├── router/              # Configuration routes
│   └── index.ts
└── theme/               # Thème personnalisé
    └── variables.css
```

## 🚀 Prochaines étapes

1. ✅ Installer les dépendances
2. ✅ Configurer le thème noir & blanc
3. 🔄 Créer les pages améliorées
4. 🔄 Créer les composants réutilisables
5. 🔄 Configurer le router

**Note**: Je vais maintenant créer les pages améliorées avec le design premium noir & blanc !