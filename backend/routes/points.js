import { Router } from 'express';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

// Associations
Point.belongsTo(Probleme, { foreignKey: 'probleme_id', as: 'probleme' });
Point.belongsTo(Entreprise, { foreignKey: 'entreprise_id', as: 'entreprise' });
Point.belongsTo(PointStatut, { foreignKey: 'point_statut_id', as: 'statut' });

// Middleware pour vérifier le rôle manager (level >= 5)
const requireManager = (req, res, next) => {
  if (!req.user || req.user.level < 5) {
    return res.status(403).json({ message: 'Accès refusé. Rôle manager requis.' });
  }
  next();
};

// GET /api/points
router.get('/', async (req, res) => {
  try {
    const { probleme_id, entreprise_id, statut_code } = req.query;
    const where = {};
    if (probleme_id) where.probleme_id = probleme_id;
    if (entreprise_id) where.entreprise_id = entreprise_id;
    if (statut_code) {
      // join on statut code
      const statut = await PointStatut.findOne({ where: { code: statut_code } });
      if (statut) where.point_statut_id = statut.id;
    }

    const points = await Point.findAll({
      where,
      include: [
        { model: Probleme, as: 'probleme', attributes: ['id', 'nom', 'description'] },
        { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom', 'telephone', 'email'] },
        { model: PointStatut, as: 'statut', attributes: ['id', 'code', 'description'] }
      ],
      order: [['date_detection', 'DESC']]
    });

    res.json(points);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/points/:id
router.get('/:id', async (req, res) => {
  try {
    const point = await Point.findByPk(req.params.id, {
      include: [
        { model: Probleme, as: 'probleme' },
        { model: Entreprise, as: 'entreprise' },
        { model: PointStatut, as: 'statut' }
      ]
    });
    if (!point) return res.status(404).json({ message: 'Point non trouvé' });
    res.json(point);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/points (Manager)
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { probleme_id, surface_m2, budget, entreprise_id, date_debut, date_fin, avancement_pourcentage, latitude, longitude, point_statut_code } = req.body;

    let statutId = null;
    if (point_statut_code) {
      const s = await PointStatut.findOne({ where: { code: point_statut_code } });
      if (s) statutId = s.id;
    }

    const point = await Point.create({
      probleme_id,
      surface_m2,
      budget,
      entreprise_id,
      date_detection: new Date(),
      date_debut,
      date_fin,
      avancement_pourcentage: avancement_pourcentage || 0,
      latitude,
      longitude,
      point_statut_id: statutId
    });

    const created = await Point.findByPk(point.id, {
      include: [
        { model: Probleme, as: 'probleme' },
        { model: Entreprise, as: 'entreprise' },
        { model: PointStatut, as: 'statut' }
      ]
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PATCH /api/points/:id (Manager) - update statut / avancement / coords
router.patch('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const point = await Point.findByPk(req.params.id);
    if (!point) return res.status(404).json({ message: 'Point non trouvé' });

    const { point_statut_code, avancement_pourcentage, latitude, longitude, date_debut, date_fin } = req.body;

    const update = {};
    if (point_statut_code) {
      const s = await PointStatut.findOne({ where: { code: point_statut_code } });
      if (!s) return res.status(400).json({ message: 'Statut inconnu' });
      update.point_statut_id = s.id;
    }
    if (avancement_pourcentage !== undefined) update.avancement_pourcentage = avancement_pourcentage;
    if (latitude !== undefined) update.latitude = latitude;
    if (longitude !== undefined) update.longitude = longitude;
    if (date_debut !== undefined) update.date_debut = date_debut;
    if (date_fin !== undefined) update.date_fin = date_fin;

    await point.update(update);

    const updated = await Point.findByPk(point.id, {
      include: [
        { model: Probleme, as: 'probleme' },
        { model: Entreprise, as: 'entreprise' },
        { model: PointStatut, as: 'statut' }
      ]
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

export default router;
