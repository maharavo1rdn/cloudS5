import models from '../models/index.js';
const { Route, Entreprise, Probleme, RoutePoint } = models;


class RouteService {
  // Créer une route
  static async createRoute(data) {
    try {
      return await Route.create(data);
    } catch (error) {
      throw new Error(`Erreur création route: ${error.message}`);
    }
  }

  // Récupérer toutes les routes
  static async getAllRoutes() {
    try {
      return await Route.findAll({
        include: [
          { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom'] },
          { model: Probleme, as: 'probleme', attributes: ['id', 'nom'] }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur récupération routes: ${error.message}`);
    }
  }

  // Récupérer une route par ID avec détails
  static async getRouteById(id) {
    try {
      const route = await Route.findByPk(id, {
        include: [
          {
            model: Entreprise,
            as: 'entreprise',
            attributes: ['id', 'nom', 'email', 'telephone']
          },
          {
            model: Probleme,
            as: 'probleme',
            attributes: ['id', 'nom', 'description']
          }
        ]
      });

      if (!route) {
        throw new Error('Route non trouvée');
      }

      return route;
    } catch (error) {
      throw new Error(`Erreur récupération route: ${error.message}`);
    }
  }

  // Récupérer les routes en travaux
  static async getRoutesEnTravaux() {
    try {
      return await Route.findAll({
        where: { statut: 'EN_COURS' },
        include: [
          { model: Entreprise, as: 'entreprise', attributes: ['id', 'nom'] },
          { model: Probleme, as: 'probleme', attributes: ['id', 'nom'] }
        ],
        order: [['date_detection', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Erreur récupération routes en travaux: ${error.message}`);
    }
  }

  // Mettre à jour une route
  static async updateRoute(id, data) {
    try {
      const route = await Route.findByPk(id);
      if (!route) {
        throw new Error('Route non trouvée');
      }

      await route.update(data);
      return route;
    } catch (error) {
      throw new Error(`Erreur mise à jour route: ${error.message}`);
    }
  }

  // Supprimer une route et ses points
  static async deleteRoute(id) {
    try {
      const route = await Route.findByPk(id);
      if (!route) {
        throw new Error('Route non trouvée');
      }

      // Supprimer les points associés
      await RoutePoint.destroy({ where: { route_id: id } });
      
      // Supprimer la route
      await route.destroy();
      
      return { message: 'Route supprimée avec succès' };
    } catch (error) {
      throw new Error(`Erreur suppression route: ${error.message}`);
    }
  }
}

export default RouteService;