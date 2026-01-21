import express, { json } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';

const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Cloud S5',
      version: '1.0.0',
      description: 'API pour l\'application Cloud S5 avec authentification et gestion des utilisateurs',
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
        Setting: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID du paramètre',
            },
            code: {
              type: 'string',
              description: 'Code unique du paramètre',
            },
            value: {
              type: 'string',
              description: 'Valeur du paramètre',
            },
            type: {
              type: 'string',
              description: 'Type du paramètre',
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'Date de création',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js'], // Paths to files containing OpenAPI definitions
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

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Backend Node.js with PostgreSQL' });
});

// Synchroniser la base de données et démarrer le serveur
const PORT = process.env.PORT || 3000;

sequelize.sync()
  .then(() => {
    console.log('Base de données synchronisée');
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erreur de synchronisation de la base de données:', error);
  });

export default app;