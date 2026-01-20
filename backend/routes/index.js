import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import routesRoutes from './routes.js';
import entreprisesRoutes from './entreprises.js';
import problemesRoutes from './problemes.js';
import etatRoutes from './etats.js';
import statistiquesRoutes from './statistiques.js';

const router = Router();

// Montez toutes les routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/routes', routesRoutes);
router.use('/entreprises', entreprisesRoutes);
router.use('/problemes', problemesRoutes);
router.use('/etat-routes', etatRoutes);
router.use('/statistiques', statistiquesRoutes);

export default router;