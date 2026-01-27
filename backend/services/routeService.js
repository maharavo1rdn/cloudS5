import { Op, Sequelize } from 'sequelize';
import Point from '../models/Point.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';
import PointStatut from '../models/PointStatut.js';

class RouteService {
  /**
   * Lister les points/routes en travaux (statut 'EN_COURS')
   */
  static async getRoutesEnTravaux() {
    try {
      const enCoursStatut = await PointStatut.findOne({
        where: { code: 'EN_COURS' }
      });

      if (!enCoursStatut) {
        throw new Error('Statut EN_COURS non trouvé');
      }

      const points = await Point.findAll({
        // where: { 
        //   point_statut_id: enCoursStatut.id 
        // },
        include: [
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom', 'description']
          },
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom', 'email', 'telephone']
          },
          {
            model: PointStatut,
            as: 'statut',
            attributes: ['id', 'code', 'description']
          }
        ],
        attributes: [
          'id',
          'surface_m2',
          'budget',
          'date_detection',
          'date_debut',
          'date_fin',
          'avancement_pourcentage',
          'latitude',
          'longitude'
        ],
        order: [['date_detection', 'DESC']]
      });

      return points;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des routes en travaux: ${error.message}`);
    }
  }

  /**
   * Récupérer les points non finis (en travaux) d'un statut spécifique
   */
  static async getPointsNonFinisParStatut(statutId) {
    try {
      const statut = await PointStatut.findByPk(statutId);
      if (!statut) {
        throw new Error('Statut non trouvé');
      }

      const points = await Point.findAll({
        where: { 
          point_statut_id: statutId,
          avancement_pourcentage: { [Op.lt]: 100 }
        },
        include: [
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom', 'description']
          },
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom', 'email', 'telephone']
          }
        ],
        attributes: [
          'id',
          'surface_m2',
          'budget',
          'date_detection',
          'date_debut',
          'avancement_pourcentage',
          'latitude',
          'longitude'
        ],
        order: [['date_detection', 'DESC']]
      });

      return {
        statut: statut.code,
        description: statut.description,
        points: points,
        count: points.length
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des points non finis: ${error.message}`);
    }
  }

  /**
   * Récupérer les points finis (terminés) d'un statut spécifique
   */
  static async getPointsFinisParStatut(statutId) {
    try {
      const statut = await PointStatut.findByPk(statutId);
      if (!statut) {
        throw new Error('Statut non trouvé');
      }

      const points = await Point.findAll({
        where: { 
          point_statut_id: statutId,
          avancement_pourcentage: 100,
          date_fin: { [Op.ne]: null }
        },
        include: [
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom', 'description']
          },
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom', 'email', 'telephone']
          }
        ],
        attributes: [
          'id',
          'surface_m2',
          'budget',
          'date_detection',
          'date_debut',
          'date_fin',
          'avancement_pourcentage',
          'latitude',
          'longitude'
        ],
        order: [['date_fin', 'DESC']]
      });

      return {
        statut: statut.code,
        description: statut.description,
        points: points,
        count: points.length
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des points finis: ${error.message}`);
    }
  }

  /**
   * Lister tous les statuts des points/routes
   */
  static async getAllStatutsRoutes() {
    try {
      const statuts = await PointStatut.findAll({
        attributes: ['id', 'code', 'description', 'niveau'],
        order: [['niveau', 'ASC']]
      });

      // Pour chaque statut, compter le nombre de points
      const statutsAvecCounts = await Promise.all(
        statuts.map(async (statut) => {
          const count = await Point.count({
            where: { point_statut_id: statut.id }
          });
          return {
            ...statut.toJSON(),
            nombre_points: count
          };
        })
      );

      return statutsAvecCounts;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statuts: ${error.message}`);
    }
  }

  /**
   * Récupérer la liste des problèmes routiers
   */
  static async getProblemesRoutiers() {
    try {
      const problemes = await Probleme.findAll({
        attributes: ['id', 'nom', 'description'],
        order: [['nom', 'ASC']]
      });

      // Pour chaque problème, compter le nombre de points
      const problemesAvecCounts = await Promise.all(
        problemes.map(async (probleme) => {
          const count = await Point.count({
            where: { probleme_id: probleme.id }
          });
          return {
            ...probleme.toJSON(),
            nombre_points: count
          };
        })
      );

      return problemesAvecCounts;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des problèmes: ${error.message}`);
    }
  }

  /**
   * Récupérer les données d'entreprise pour un point/route spécifique
   */
  static async getEntreprisePourPoint(pointId) {
    try {
      const point = await Point.findByPk(pointId, {
        include: [
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom', 'email', 'telephone', 'created_at']
          },
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom']
          }
        ],
        attributes: ['id', 'date_detection', 'date_debut', 'date_fin']
      });

      if (!point) {
        throw new Error('Point non trouvé');
      }

      if (!point.entreprise) {
        throw new Error('Aucune entreprise assignée à ce point');
      }

      return {
        point_id: point.id,
        probleme: point.probleme.nom,
        date_detection: point.date_detection,
        entreprise: point.entreprise
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'entreprise: ${error.message}`);
    }
  }

  /**
   * Données pour le tableau récapitulatif
   */
  static async getTableauRecapitulatif() {
    try {
      // Statistiques générales avec Sequelize
      const totalPoints = await Point.count();
      
      // Utiliser SUM avec Sequelize.literal pour éviter les erreurs
      const totalSurfaceResult = await Point.sum('surface_m2');
      const totalBudgetResult = await Point.sum('budget');
      
      // Calculer la moyenne d'avancement manuellement
      const avancementResult = await Point.findOne({
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('avancement_pourcentage')), 'moyenne']
        ],
        raw: true
      });

      const totalSurface = totalSurfaceResult ? parseFloat(totalSurfaceResult) : 0;
      const totalBudget = totalBudgetResult ? parseFloat(totalBudgetResult) : 0;
      const avgAvancement = avancementResult ? parseFloat(avancementResult.moyenne) : 0;

      // Statistiques par statut avec requête SQL
      const [statutsResults] = await PointStatut.sequelize.query(`
        SELECT 
          ps.id,
          ps.code,
          ps.description,
          ps.niveau,
          COUNT(p.id) as nombre_points,
          COALESCE(SUM(p.surface_m2), 0) as surface_totale,
          COALESCE(SUM(p.budget), 0) as budget_total,
          COALESCE(AVG(p.avancement_pourcentage), 0) as moyenne_avancement
        FROM point_statut ps
        LEFT JOIN points p ON ps.id = p.point_statut_id
        GROUP BY ps.id, ps.code, ps.description, ps.niveau
        ORDER BY ps.niveau ASC
      `);

      // Points récents (7 derniers jours)
      const date7Jours = new Date();
      date7Jours.setDate(date7Jours.getDate() - 7);

      const pointsRecents = await Point.findAll({
        where: {
          created_at: {
            [Op.gte]: date7Jours
          }
        },
        include: [
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['nom']
          },
          {
            model: PointStatut,
            as: 'statut',
            attributes: ['code', 'description']
          }
        ],
        attributes: [
          'id', 
          'date_detection', 
          'surface_m2', 
          'budget', 
          'avancement_pourcentage',
          'latitude',
          'longitude'
        ],
        order: [['created_at', 'DESC']],
        limit: 10
      });

      // Statistiques supplémentaires
      const pointsEnCours = await Point.count({
        where: {
          avancement_pourcentage: { [Op.lt]: 100 }
        }
      });

      const pointsTermines = await Point.count({
        where: {
          avancement_pourcentage: 100
        }
      });

      const pointsSansBudget = await Point.count({
        where: {
          budget: { [Op.is]: null }
        }
      });

      return {
        resume_general: {
          total_points: totalPoints || 0,
          total_surface_m2: totalSurface,
          total_budget: totalBudget,
          moyenne_avancement: Math.round(avgAvancement * 100) / 100, // Arrondi à 2 décimales
          points_en_cours: pointsEnCours,
          points_termines: pointsTermines,
          points_sans_budget: pointsSansBudget
        },
        par_statut: statutsResults.map(statut => ({
          statut: statut.code,
          description: statut.description,
          niveau: statut.niveau,
          nombre_points: parseInt(statut.nombre_points) || 0,
          surface_totale: parseFloat(statut.surface_totale) || 0,
          budget_total: parseFloat(statut.budget_total) || 0,
          moyenne_avancement: Math.round(parseFloat(statut.moyenne_avancement) * 100) / 100
        })),
        points_recents: pointsRecents.map(point => ({
          id: point.id,
          date_detection: point.date_detection,
          probleme: point.probleme ? point.probleme.nom : 'Non spécifié',
          statut: point.statut ? point.statut.code : 'Non défini',
          surface_m2: point.surface_m2,
          budget: point.budget,
          avancement_pourcentage: point.avancement_pourcentage,
          location: point.latitude && point.longitude ? 
            { lat: point.latitude, lng: point.longitude } : null
        })),
        evolution: {
          derniers_7_jours: pointsRecents.length,
          taux_completion: totalPoints > 0 ? 
            Math.round((pointsTermines / totalPoints) * 100) : 0
        }
      };
    } catch (error) {
      console.error('Erreur détaillée:', error);
      throw new Error(`Erreur lors de la génération du tableau récapitulatif: ${error.message}`);
    }
  }
}

export default RouteService;