import { Router } from 'express';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import PointImage from '../models/PointImage.js';
import authenticateToken from '../middleware/auth.js';

const router = Router();

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
    const { probleme_id, entreprise_id, statut_code, sans_niveau, sans_prix } = req.query;
    const where = {};
    if (probleme_id) where.probleme_id = probleme_id;
    if (entreprise_id) where.entreprise_id = entreprise_id;
    if (statut_code) {
      // join on statut code
      const statut = await PointStatut.findOne({ where: { code: statut_code } });
      if (statut) where.point_statut_id = statut.id;
    }
    // Filtres manager : points sans niveau ou sans prix_par_m2
    if (sans_niveau === 'true') where.niveau = null;
    if (sans_prix === 'true') where.prix_par_m2 = null;

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
        { model: PointStatut, as: 'statut' },
        { model: PointImage, as: 'images', attributes: ['id', 'image_url', 'firebase_url', 'created_at'] }
      ]
    });
    if (!point) return res.status(404).json({ message: 'Point non trouvé' });
    res.json(point);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Helper mapping status code -> avancement
const statutToAvancement = {
  'A_FAIRE': 0,
  'EN_COURS': 50,
  'TERMINE': 100,
  'NOUVEAU': 0
};

// POST /api/points (Manager)
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { probleme_id, surface_m2, budget, niveau, prix_par_m2, entreprise_id, date_debut, date_fin, /* avancement_pourcentage, */ latitude, longitude, point_statut_code } = req.body;

    let statutId = null;
    let computedAvancement = 0;
    if (point_statut_code) {
      const s = await PointStatut.findOne({ where: { code: point_statut_code } });
      if (s) {
        statutId = s.id;
        computedAvancement = statutToAvancement[s.code] ?? 0;
      }
    }

    // Auto-calcul du budget : prix_par_m2 * niveau * surface_m2
    let computedBudget = budget;
    if (prix_par_m2 && niveau && surface_m2) {
      computedBudget = parseFloat(prix_par_m2) * parseInt(niveau) * parseFloat(surface_m2);
    }

    const point = await Point.create({
      probleme_id,
      surface_m2,
      budget: computedBudget,
      niveau,
      prix_par_m2,
      entreprise_id,
      date_detection: new Date(),
      date_debut,
      date_fin,
      avancement_pourcentage: computedAvancement,
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

    const { point_statut_code, /* avancement_pourcentage, */ latitude, longitude, date_debut, date_fin, niveau, prix_par_m2 } = req.body;

    const update = {};
    if (point_statut_code) {
      const s = await PointStatut.findOne({ where: { code: point_statut_code } });
      if (!s) return res.status(400).json({ message: 'Statut inconnu' });
      update.point_statut_id = s.id;
      // compute avancement server-side according to business rule
      update.avancement_pourcentage = statutToAvancement[s.code] ?? 0;
    }
    // Ignore any avancement_pourcentage supplied by client - server computes it
    if (latitude !== undefined) update.latitude = latitude;
    if (longitude !== undefined) update.longitude = longitude;
    if (date_debut !== undefined) update.date_debut = date_debut;
    if (date_fin !== undefined) update.date_fin = date_fin;
    if (niveau !== undefined) update.niveau = niveau;
    if (prix_par_m2 !== undefined) update.prix_par_m2 = prix_par_m2;

    // Auto-calcul du budget : prix_par_m2 * niveau * surface_m2
    const finalNiveau = update.niveau !== undefined ? update.niveau : point.niveau;
    const finalPrixM2 = update.prix_par_m2 !== undefined ? update.prix_par_m2 : point.prix_par_m2;
    const finalSurface = point.surface_m2;
    if (finalPrixM2 && finalNiveau && finalSurface) {
      update.budget = parseFloat(finalPrixM2) * parseInt(finalNiveau) * parseFloat(finalSurface);
    }

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
