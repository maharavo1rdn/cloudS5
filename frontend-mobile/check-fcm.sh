#!/bin/bash

# Script de vérification de la configuration FCM

echo "🔍 Vérification de la configuration Firebase Cloud Messaging..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur : Ce script doit être exécuté depuis frontend-mobile/${NC}"
    exit 1
fi

# Vérifier le package push-notifications
echo "📦 Vérification des dépendances..."
if grep -q "@capacitor/push-notifications" package.json; then
    echo -e "${GREEN}✅ @capacitor/push-notifications installé${NC}"
else
    echo -e "${RED}❌ @capacitor/push-notifications NON installé${NC}"
    echo "   Exécuter : npm install @capacitor/push-notifications@7.0.4"
fi

# Vérifier google-services.json
echo ""
echo "🔥 Vérification de la configuration Firebase..."
if [ -f "android/app/google-services.json" ]; then
    echo -e "${GREEN}✅ google-services.json trouvé${NC}"
    
    # Vérifier le package_name
    PACKAGE_NAME=$(grep -o '"package_name": "[^"]*"' android/app/google-services.json | head -1 | cut -d'"' -f4)
    if [ ! -z "$PACKAGE_NAME" ]; then
        echo "   Package name : $PACKAGE_NAME"
    fi
else
    echo -e "${RED}❌ google-services.json NON trouvé${NC}"
    echo ""
    echo "📝 Instructions pour télécharger google-services.json :"
    echo "   1. Aller sur https://console.firebase.google.com/"
    echo "   2. Sélectionner votre projet"
    echo "   3. Settings (⚙️) → Project Settings"
    echo "   4. Onglet General → Section 'Your apps'"
    echo "   5. Cliquer sur votre app Android (ou en créer une)"
    echo "   6. Télécharger google-services.json"
    echo "   7. Placer le fichier : cp google-services.json android/app/"
    echo ""
fi

# Vérifier capacitor.config.ts
echo ""
echo "⚙️  Vérification capacitor.config.ts..."
if [ -f "capacitor.config.ts" ]; then
    APP_ID=$(grep -o "appId: '[^']*'" capacitor.config.ts | cut -d"'" -f2)
    echo -e "${GREEN}✅ capacitor.config.ts trouvé${NC}"
    echo "   App ID : $APP_ID"
    
    if [ ! -z "$PACKAGE_NAME" ] && [ "$APP_ID" != "$PACKAGE_NAME" ]; then
        echo -e "${YELLOW}⚠️  Attention : App ID ($APP_ID) != Package name ($PACKAGE_NAME)${NC}"
        echo "   Vérifier que le package_name dans google-services.json correspond"
    fi
else
    echo -e "${RED}❌ capacitor.config.ts NON trouvé${NC}"
fi

# Vérifier si le build Android existe
echo ""
echo "📱 Vérification du projet Android..."
if [ -d "android" ]; then
    echo -e "${GREEN}✅ Dossier android/ existe${NC}"
    
    if [ -f "android/app/build.gradle" ]; then
        if grep -q "com.google.gms.google-services" android/app/build.gradle; then
            echo -e "${GREEN}✅ Plugin google-services configuré dans build.gradle${NC}"
        else
            echo -e "${YELLOW}⚠️  Plugin google-services non détecté dans build.gradle${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Dossier android/ non trouvé${NC}"
    echo "   Créer avec : npx cap add android"
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RÉSUMÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "android/app/google-services.json" ]; then
    echo -e "${GREEN}✅ Configuration FCM complète${NC}"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "   1. npm run build"
    echo "   2. npx cap sync android"
    echo "   3. npx cap open android"
    echo "   4. Build & Run sur un appareil physique"
else
    echo -e "${RED}❌ Configuration FCM incomplète${NC}"
    echo ""
    echo "⚠️  Il manque : android/app/google-services.json"
    echo ""
    echo "📖 Voir NOTIFICATIONS_FIX.md pour les instructions complètes"
fi

echo ""
