// generate-postman.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de la collection Postman
const collection = {
  info: {
    name: "API Routes - Projet Routes",
    description: "Collection générée automatiquement depuis les fichiers de routes",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:3000",
      type: "string"
    },
    {
      key: "token",
      value: "",
      type: "string"
    }
  ],
  item: []
};

// Fonction pour extraire les routes d'un fichier
function extractRoutesFromFile(fileContent, fileName) {
  const routes = [];
  const lines = fileContent.split('\n');
  
  let currentMethod = '';
  let currentPath = '';
  let currentSummary = '';
  let inSwaggerBlock = false;
  let swaggerLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Détecter le début d'un bloc Swagger
    if (line.includes('@swagger')) {
      inSwaggerBlock = true;
      swaggerLines = [];
      continue;
    }
    
    // Collecter les lignes du bloc Swagger
    if (inSwaggerBlock) {
      swaggerLines.push(line);
      
      // Extraire le summary
      if (line.includes('summary:')) {
        const match = line.match(/summary:\s*(.+)/);
        if (match) currentSummary = match[1].trim();
      }
      
      // Fin du bloc Swagger
      if (line.includes('*/')) {
        inSwaggerBlock = false;
      }
      continue;
    }
    
    // Détecter les routes (router.get, router.post, etc.)
    const methodMatch = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (methodMatch) {
      currentMethod = methodMatch[1].toUpperCase();
      currentPath = methodMatch[2];
      
      // Vérifier si c'est une route avec paramètre
      const paramMatch = line.match(/router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(async\s*)?\(/);
      if (paramMatch) {
        // Route normale
        routes.push({
          method: currentMethod,
          path: currentPath,
          summary: currentSummary || `${currentMethod} ${currentPath}`,
          fileName: fileName,
          requiresAuth: line.includes('authenticateToken'),
          requiresManager: line.includes('requireManager'),
          requiresAdmin: line.includes('requireAdmin')
        });
        
        // Réinitialiser pour la prochaine route
        currentSummary = '';
      }
    }
  }
  
  return routes;
}

// Fonction pour créer un dossier Postman
function createPostmanFolder(folderName, routes, basePath = '/api') {
  const folder = {
    name: folderName.charAt(0).toUpperCase() + folderName.slice(1),
    description: `Routes du module ${folderName}`,
    item: []
  };
  
  // Grouper les routes par path pour éviter les doublons
  const uniqueRoutes = {};
  
  routes.forEach(route => {
    const key = `${route.method}:${route.path}`;
    if (!uniqueRoutes[key]) {
      uniqueRoutes[key] = route;
    }
  });
  
  // Créer les requêtes Postman
  Object.values(uniqueRoutes).forEach(route => {
    const request = {
      name: route.summary,
      request: {
        method: route.method,
        header: [],
        url: {
          raw: `{{baseUrl}}${basePath}/${folderName}${route.path.startsWith('/') ? '' : '/'}${route.path}`,
          host: ["{{baseUrl}}"],
          path: `${basePath}/${folderName}${route.path.startsWith('/') ? '' : '/'}${route.path}`.split('/').filter(p => p)
        },
        description: route.summary
      }
    };
    
    // Ajouter les headers nécessaires
    request.request.header.push({
      key: 'Content-Type',
      value: 'application/json',
      type: 'text'
    });
    
    // Ajouter l'authentification si nécessaire
    if (route.requiresAuth || route.requiresManager || route.requiresAdmin) {
      request.request.header.push({
        key: 'Authorization',
        value: 'Bearer {{token}}',
        type: 'text'
      });
    }
    
    // Ajouter un body d'exemple pour POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      request.request.body = {
        mode: 'raw',
        raw: JSON.stringify(getExampleBody(folderName, route.path), null, 2),
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    }
    
    folder.item.push(request);
  });
  
  return folder;
}

// Fonction pour générer des body d'exemple
function getExampleBody(folderName, path) {
  const examples = {
    auth: {
      '/register': {
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      },
      '/login': {
        email: "test@example.com",
        password: "password123"
      }
    },
    entreprises: {
      '/': {
        nom: "Entreprise Test",
        email: "contact@entreprise.com",
        telephone: "+261 34 12 345 67"
      }
    },
    points: {
      '/': {
        probleme_id: 1,
        surface_m2: 100,
        budget: 5000000,
        niveau: 3,
        prix_par_m2: 50000,
        entreprise_id: 1,
        latitude: -18.8792,
        longitude: 47.5079,
        point_statut_code: "A_FAIRE"
      }
    },
    problemes: {
      '/': {
        nom: "Nid de poule",
        description: "Trou dans la chaussée"
      }
    },
    users: {
      '/': {
        username: "nouvelutilisateur",
        email: "nouveau@example.com",
        password: "password123",
        role: "utilisateur"
      }
    },
    settings: {
      '/': {
        code: "MAX_LOGIN_ATTEMPTS",
        value: "5",
        type: "number"
      }
    }
  };
  
  return examples[folderName]?.[path] || {};
}

// Fonction principale
async function generatePostmanCollection() {
  console.log('🔄 Génération de la collection Postman...\n');
  
  // Dossier contenant vos fichiers de routes
  const routesDir = path.join(__dirname, 'routes');
  
  try {
    // Lire tous les fichiers .js du dossier routes
    const files = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));
    
    for (const file of files) {
      const filePath = path.join(routesDir, file);
      const fileName = file.replace('.js', '');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📄 Traitement de: ${file}`);
      
      // Extraire les routes
      const routes = extractRoutesFromFile(fileContent, fileName);
      
      if (routes.length > 0) {
        // Déterminer le basePath selon le fichier
        let basePath = '/api';
        
        // Cas spéciaux pour les routes API
        if (fileName === 'routesAPI' || fileName === 'routes') {
          basePath = '/api';
        } else if (fileName === 'syncBidirectional') {
          basePath = '/api/sync';
        }
        
        // Créer le dossier Postman
        const folder = createPostmanFolder(fileName, routes, basePath);
        collection.item.push(folder);
        
        console.log(`  ✓ ${routes.length} routes extraites`);
      } else {
        console.log(`  ⚠️ Aucune route trouvée`);
      }
    }
    
    // Créer un dossier pour les endpoints spéciaux
    const specialEndpoints = {
      name: "Endpoints Spéciaux",
      item: [
        {
          name: "Statut Synchronisation",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/api/sync/status",
              host: ["{{baseUrl}}"],
              path: ["api", "sync", "status"]
            }
          }
        },
        {
          name: "Synchronisation Complète",
          request: {
            method: "POST",
            header: [{
              key: "Content-Type",
              value: "application/json",
              type: "text"
            }],
            url: {
              raw: "{{baseUrl}}/api/sync/full",
              host: ["{{baseUrl}}"],
              path: ["api", "sync", "full"]
            },
            body: {
              mode: "raw",
              raw: JSON.stringify({ force: false }, null, 2)
            }
          }
        }
      ]
    };
    
    collection.item.push(specialEndpoints);
    
    // Sauvegarder la collection
    const outputPath = path.join(__dirname, 'postman-collection.json');
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
    
    console.log('\n✅ Collection générée avec succès!');
    console.log(`📁 Fichier: ${outputPath}`);
    console.log(`📊 Dossiers: ${collection.item.length}`);
    
    // Afficher le résumé
    console.log('\n📋 Résumé des endpoints:');
    collection.item.forEach(folder => {
      console.log(`  ${folder.name}: ${folder.item.length} endpoints`);
    });
    
    // Créer un fichier d'environnement
    createEnvironmentFile();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Fonction pour créer un fichier d'environnement Postman
function createEnvironmentFile() {
  const environment = {
    id: "env-project-routes",
    name: "Environnement Local",
    values: [
      {
        key: "baseUrl",
        value: "http://localhost:3000",
        type: "default",
        enabled: true
      },
      {
        key: "token",
        value: "",
        type: "secret",
        enabled: true
      },
      {
        key: "userId",
        value: "1",
        type: "default",
        enabled: true
      },
      {
        key: "entrepriseId",
        value: "1",
        type: "default",
        enabled: true
      },
      {
        key: "pointId",
        value: "1",
        type: "default",
        enabled: true
      }
    ]
  };
  
  const envPath = path.join(__dirname, 'postman-environment.json');
  fs.writeFileSync(envPath, JSON.stringify(environment, null, 2));
  console.log(`🌍 Environnement: ${envPath}`);
}

// Générer la collection
generatePostmanCollection();