import express, { json } from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';

const app = express();

// Middleware
app.use(cors());
app.use(json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API Backend Node.js avec PostgreSQL' });
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