import RoutePoint from '../models/RoutePoint.js';

class RoutePointService {
  // Créer un point de route
  static async createRoutePoint(data) {
    try {
      return await RoutePoint.create(data);
    } catch (error) {
      throw new Error(`Erreur création point: ${error.message}`);
    }
  }

  // Récupérer tous les points d'une route
  static async getPointsByRoute(routeId) {
    try {
      return await RoutePoint.findAll({
        where: { route_id: routeId },
        order: [['ordre', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Erreur récupération points: ${error.message}`);
    }
  }

  // Récupérer les points par route et état
  static async getPointsByRouteAndEtat(routeId, etat) {
    try {
      let statutCondition;
      
      if (etat === 'non_finis') {
        statutCondition = ['A_TRAITER', 'EN_COURS'];
      } else if (etat === 'finis') {
        statutCondition = ['FINI'];
      } else {
        throw new Error("État invalide. Utilisez 'non_finis' ou 'finis'");
      }

      return await RoutePoint.findAll({
        where: {
          route_id: routeId,
          point_statut: statutCondition
        },
        order: [['ordre', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Erreur récupération points par état: ${error.message}`);
    }
  }

  // Mettre à jour le statut d'un point
  static async updatePointStatut(id, point_statut) {
    try {
      const point = await RoutePoint.findByPk(id);
      if (!point) {
        throw new Error('Point non trouvé');
      }

      await point.update({ point_statut });
      return point;
    } catch (error) {
      throw new Error(`Erreur mise à jour point: ${error.message}`);
    }
  }

  // Supprimer les points d'une route
  static async deletePointsByRoute(routeId) {
    try {
      const result = await RoutePoint.destroy({
        where: { route_id: routeId }
      });
      
      return { message: `${result} points supprimés` };
    } catch (error) {
      throw new Error(`Erreur suppression points: ${error.message}`);
    }
  }
}

export default RoutePointService;