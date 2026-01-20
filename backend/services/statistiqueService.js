import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

class StatistiqueService {
  static async getTableauRecapitulatif() {
    try {
      // 1. Statistiques de base des routes
      const statsQuery = `
        SELECT 
          COUNT(*) as total_routes,
          COALESCE(SUM(surface_m2), 0) as total_surface_m2,
          COALESCE(SUM(budget), 0) as total_budget,
          COALESCE(AVG(avancement_pourcentage), 0) as avancement_global_pourcentage,
          SUM(CASE WHEN statut = 'NOUVEAU' THEN 1 ELSE 0 END) as routes_nouvelles,
          SUM(CASE WHEN statut = 'EN_COURS' THEN 1 ELSE 0 END) as routes_en_cours,
          SUM(CASE WHEN statut = 'TERMINE' THEN 1 ELSE 0 END) as routes_terminees
        FROM routes
      `;

      // 2. Statistiques des points
      const pointsQuery = `
        SELECT 
          COUNT(*) as total_points,
          COALESCE(SUM(CASE WHEN point_statut = 'FINI' THEN 1 ELSE 0 END), 0) as points_finis,
          COALESCE(SUM(CASE WHEN point_statut = 'EN_COURS' THEN 1 ELSE 0 END), 0) as points_en_cours,
          COALESCE(SUM(CASE WHEN point_statut = 'A_TRAITER' THEN 1 ELSE 0 END), 0) as points_a_traiter
        FROM route_points
      `;

      // 3. Routes en cours
      const routesQuery = `
        SELECT 
          r.id,
          r.nom,
          r.statut,
          r.surface_m2,
          r.budget,
          r.avancement_pourcentage,
          COALESCE(e.nom, 'Non assignée') as entreprise_nom,
          COALESCE(p.nom, 'Non spécifié') as probleme_nom
        FROM routes r
        LEFT JOIN entreprises e ON r.entreprise_id = e.id
        LEFT JOIN problemes p ON r.probleme_id = p.id
        WHERE r.statut != 'TERMINE'
        ORDER BY r.date_detection DESC
      `;

      // 4. Exécuter les requêtes
      const [statsResult, pointsResult, routesResult] = await Promise.all([
        sequelize.query(statsQuery, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(pointsQuery, { type: Sequelize.QueryTypes.SELECT }),
        sequelize.query(routesQuery, { type: Sequelize.QueryTypes.SELECT })
      ]);

      const stats = statsResult[0];
      const points = pointsResult[0];

      // 5. Ajouter les points à chaque route
      const routesWithPoints = [];
      for (const route of routesResult) {
        const pointsForRouteQuery = `
          SELECT 
            COUNT(*) as total_points,
            SUM(CASE WHEN point_statut = 'FINI' THEN 1 ELSE 0 END) as points_finis
          FROM route_points 
          WHERE route_id = ${route.id}
        `;
        
        const pointsForRoute = await sequelize.query(pointsForRouteQuery, {
          type: Sequelize.QueryTypes.SELECT
        });

        routesWithPoints.push({
          ...route,
          points_finis: parseInt(pointsForRoute[0]?.points_finis) || 0,
          points_restants: (parseInt(pointsForRoute[0]?.total_points) || 0) - (parseInt(pointsForRoute[0]?.points_finis) || 0)
        });
      }

      // 6. Calculer les pourcentages
      const totalRoutes = parseInt(stats.total_routes) || 0;
      const totalPoints = parseInt(points.total_points) || 0;
      const pointsFinis = parseInt(points.points_finis) || 0;
      const routesTerminees = parseInt(stats.routes_terminees) || 0;

      const pourcentagePointsFinis = totalPoints > 0 
        ? (pointsFinis / totalPoints) * 100 
        : 0;
      
      const pourcentageRoutesTerminees = totalRoutes > 0 
        ? (routesTerminees / totalRoutes) * 100 
        : 0;

      return {
        statistiques: {
          total_routes: totalRoutes,
          total_points: totalPoints,
          total_surface_m2: parseFloat(stats.total_surface_m2) || 0,
          total_budget: parseFloat(stats.total_budget) || 0,
          avancement_global_pourcentage: parseFloat(stats.avancement_global_pourcentage) || 0,
          pourcentage_points_finis: parseFloat(pourcentagePointsFinis.toFixed(2)),
          pourcentage_routes_terminees: parseFloat(pourcentageRoutesTerminees.toFixed(2)),
          points_finis: pointsFinis,
          points_en_cours: parseInt(points.points_en_cours) || 0,
          points_a_traiter: parseInt(points.points_a_traiter) || 0,
          routes_nouvelles: parseInt(stats.routes_nouvelles) || 0,
          routes_en_cours: parseInt(stats.routes_en_cours) || 0,
          routes_terminees: routesTerminees
        },
        routes_en_cours: routesWithPoints
      };
    } catch (error) {
      console.error('Erreur SQL détaillée:', error);
      throw new Error(`Erreur récupération tableau récapitulatif: ${error.message}`);
    }
  }

  static async getEtatsRoutes() {
    try {
      const query = `
        SELECT 
          statut,
          COUNT(*) as nombre_routes,
          COALESCE(SUM(budget), 0) as total_budget,
          COALESCE(SUM(surface_m2), 0) as total_surface,
          COALESCE(AVG(avancement_pourcentage), 0) as avancement_moyen
        FROM routes
        GROUP BY statut
        ORDER BY statut
      `;

      const result = await sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT
      });

      const totals = {
        total_routes: result.reduce((sum, row) => sum + parseInt(row.nombre_routes), 0),
        total_budget: result.reduce((sum, row) => sum + parseFloat(row.total_budget || 0), 0),
        total_surface: result.reduce((sum, row) => sum + parseFloat(row.total_surface || 0), 0)
      };

      return {
        etats: result,
        totaux: totals
      };
    } catch (error) {
      console.error('Erreur SQL états routes:', error);
      throw new Error(`Erreur récupération états routes: ${error.message}`);
    }
  }
}

export default StatistiqueService;