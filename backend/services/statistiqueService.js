import Route from '../models/Route.js';
import RoutePoint from '../models/RoutePoint.js';

class StatistiqueService {
  // Récupérer les états des routes
  static async getEtatsRoutes() {
    try {
      const result = await Route.findAll({
        attributes: [
          'statut',
          [sequelize.fn('COUNT', sequelize.col('id')), 'nombre_routes'],
          [sequelize.fn('SUM', sequelize.col('budget')), 'total_budget'],
          [sequelize.fn('SUM', sequelize.col('surface_m2')), 'total_surface'],
          [sequelize.fn('AVG', sequelize.col('avancement_pourcentage')), 'avancement_moyen']
        ],
        group: ['statut'],
        order: [['statut', 'ASC']]
      });

      // Calculer les totaux
      const totals = {
        total_routes: result.reduce((sum, row) => sum + parseInt(row.dataValues.nombre_routes), 0),
        total_budget: result.reduce((sum, row) => sum + parseFloat(row.dataValues.total_budget || 0), 0),
        total_surface: result.reduce((sum, row) => sum + parseFloat(row.dataValues.total_surface || 0), 0)
      };

      return {
        etats: result,
        totaux: totals
      };
    } catch (error) {
      throw new Error(`Erreur récupération états routes: ${error.message}`);
    }
  }

  // Récupérer le tableau récapitulatif
  static async getTableauRecapitulatif() {
    try {
      // Récupérer les statistiques
      const stats = await Route.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('Route.id')), 'total_routes'],
          [sequelize.fn('SUM', sequelize.col('surface_m2')), 'total_surface_m2'],
          [sequelize.fn('SUM', sequelize.col('budget')), 'total_budget'],
          [sequelize.fn('AVG', sequelize.col('avancement_pourcentage')), 'avancement_global_pourcentage'],
          [sequelize.literal(`SUM(CASE WHEN Route.statut = 'NOUVEAU' THEN 1 ELSE 0 END)`), 'routes_nouvelles'],
          [sequelize.literal(`SUM(CASE WHEN Route.statut = 'EN_COURS' THEN 1 ELSE 0 END)`), 'routes_en_cours'],
          [sequelize.literal(`SUM(CASE WHEN Route.statut = 'TERMINE' THEN 1 ELSE 0 END)`), 'routes_terminees']
        ]
      });

      // Récupérer les statistiques des points
      const pointsStats = await RoutePoint.findOne({
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_points'],
          [sequelize.literal(`SUM(CASE WHEN point_statut = 'FINI' THEN 1 ELSE 0 END)`), 'points_finis'],
          [sequelize.literal(`SUM(CASE WHEN point_statut = 'EN_COURS' THEN 1 ELSE 0 END)`), 'points_en_cours'],
          [sequelize.literal(`SUM(CASE WHEN point_statut = 'A_TRAITER' THEN 1 ELSE 0 END)`), 'points_a_traiter']
        ]
      });

      // Récupérer les routes en cours avec détails
      const routesEnCours = await Route.findAll({
        where: { statut: { [Op.ne]: 'TERMINE' } },
        include: [
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom']
          },
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom']
          }
        ],
        attributes: [
          'id', 'nom', 'statut', 'surface_m2', 'budget', 'avancement_pourcentage',
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM route_points 
              WHERE route_points.route_id = Route.id 
              AND route_points.point_statut = 'FINI'
            )`),
            'points_finis'
          ],
          [
            sequelize.literal(`(
              SELECT COUNT(*) FROM route_points 
              WHERE route_points.route_id = Route.id 
              AND route_points.point_statut IN ('EN_COURS', 'A_TRAITER')
            )`),
            'points_restants'
          ]
        ],
        order: [['date_detection', 'DESC']]
      });

      // Calculer les pourcentages
      const pourcentagePointsFinis = pointsStats.dataValues.total_points > 0 
        ? (pointsStats.dataValues.points_finis / pointsStats.dataValues.total_points) * 100 
        : 0;
      
      const pourcentageRoutesTerminees = stats.dataValues.total_routes > 0 
        ? (stats.dataValues.routes_terminees / stats.dataValues.total_routes) * 100 
        : 0;

      return {
        statistiques: {
          total_routes: parseInt(stats.dataValues.total_routes) || 0,
          total_points: parseInt(pointsStats.dataValues.total_points) || 0,
          total_surface_m2: parseFloat(stats.dataValues.total_surface_m2) || 0,
          total_budget: parseFloat(stats.dataValues.total_budget) || 0,
          avancement_global_pourcentage: parseFloat(stats.dataValues.avancement_global_pourcentage) || 0,
          pourcentage_points_finis: parseFloat(pourcentagePointsFinis.toFixed(2)),
          pourcentage_routes_terminees: parseFloat(pourcentageRoutesTerminees.toFixed(2)),
          points_finis: parseInt(pointsStats.dataValues.points_finis) || 0,
          points_en_cours: parseInt(pointsStats.dataValues.points_en_cours) || 0,
          points_a_traiter: parseInt(pointsStats.dataValues.points_a_traiter) || 0,
          routes_nouvelles: parseInt(stats.dataValues.routes_nouvelles) || 0,
          routes_en_cours: parseInt(stats.dataValues.routes_en_cours) || 0,
          routes_terminees: parseInt(stats.dataValues.routes_terminees) || 0
        },
        routes_en_cours: routesEnCours
      };
    } catch (error) {
      throw new Error(`Erreur récupération tableau récapitulatif: ${error.message}`);
    }
  }
}

export default StatistiqueService;