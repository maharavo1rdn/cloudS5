import express, { json } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import routes from './routes/index.js'; // Ceci importe votre router principal

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Gestion Routes',
      version: '1.0.0',
      description: 'API pour la gestion des routes endommagées avec authentification',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Entreprise: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            email: { type: 'string', format: 'email' },
            telephone: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Probleme: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Route: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nom: { type: 'string' },
            description: { type: 'string' },
            statut: { type: 'string', enum: ['NOUVEAU', 'EN_COURS', 'TERMINE'] },
            etat: { type: 'string', enum: ['FINI', 'EN_TRAVAUX', 'EN_ATTENTE', 'INTACTE', 'ENDOMMAGEE'] },
            surface_m2: { type: 'number', format: 'float' },
            budget: { type: 'number', format: 'float' },
            avancement_pourcentage: { type: 'integer', minimum: 0, maximum: 100 },
            probleme_id: { type: 'integer' },
            entreprise_id: { type: 'integer' },
            date_detection: { type: 'string', format: 'date' },
            date_debut: { type: 'string', format: 'date' },
            date_fin: { type: 'string', format: 'date' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        RoutePoint: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            route_id: { type: 'integer' },
            latitude: { type: 'number', format: 'double' },
            longitude: { type: 'number', format: 'double' },
            ordre: { type: 'integer' },
            point_statut: { type: 'string', enum: ['A_TRAITER', 'EN_COURS', 'FINI'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',')
    : "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
};

app.use(cors(corsOptions));
app.use(json());

// Middleware de logging pour déboguer
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    hasBody: !!req.body,
    bodyKeys: req.body ? Object.keys(req.body) : 'no body',
    contentType: req.headers['content-type']
  });
  
  next();
});

// Routes d'authentification (gardez-les si vous les utilisez séparément)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// MONTEZ VOTRE ROUTER PRINCIPAL ICI (AJOUTEZ CETTE LIGNE)
app.use('/api', routes); // <--- CETTE LIGNE EST MANQUANTE

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Backend Node.js with PostgreSQL',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      routes: '/api/routes',
      entreprises: '/api/entreprises',
      problemes: '/api/problemes',
      etats: '/api/etat-routes',
      statistiques: '/api/statistiques',
      documentation: '/api-docs'
    }
  });
});

// Synchroniser la base de données et démarrer le serveur
const PORT = process.env.PORT || 3000;

sequelize.sync()
  .then(() => {
    console.log('Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
      console.log(`Documentation Swagger: http://localhost:${PORT}/api-docs`);
      console.log(`Routes disponibles:`);
      console.log(`  GET  /api/entreprises`);
      console.log(`  GET  /api/routes/en-travaux`);
      console.log(`  GET  /api/problemes`);
      console.log(`  GET  /api/etat-routes`);
      console.log(`  GET  /api/statistiques/tableau-recap`);
    });
  })
  .catch((error) => {
    console.error('Erreur de synchronisation de la base de données:', error);
  });

export default app;