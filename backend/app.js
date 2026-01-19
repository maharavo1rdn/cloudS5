import express, { json } from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const app = express();

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