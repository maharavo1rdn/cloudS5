import Entreprise from '../models/Entreprise.js';

class EntrepriseService {
  // Créer une entreprise
  static async createEntreprise(data) {
    try {
      return await Entreprise.create(data);
    } catch (error) {
      throw new Error(`Erreur création entreprise: ${error.message}`);
    }
  }

  // Récupérer toutes les entreprises
  static async getAllEntreprises() {
    try {
      return await Entreprise.findAll({
        order: [['nom', 'ASC']]
      });
    } catch (error) {
      throw new Error(`Erreur récupération entreprises: ${error.message}`);
    }
  }

  // Récupérer une entreprise par ID
  static async getEntrepriseById(id) {
    try {
      const entreprise = await Entreprise.findByPk(id);
      if (!entreprise) {
        throw new Error('Entreprise non trouvée');
      }
      return entreprise;
    } catch (error) {
      throw new Error(`Erreur récupération entreprise: ${error.message}`);
    }
  }

  // Récupérer l'entreprise d'une route
  static async getEntrepriseByRoute(routeId) {
    try {
      const entreprise = await Entreprise.findOne({
        include: [{
          model: Route,
          as: 'routes',
          where: { id: routeId },
          attributes: ['id', 'nom', 'statut']
        }]
      });

      if (!entreprise) {
        throw new Error('Aucune entreprise trouvée pour cette route');
      }

      return entreprise;
    } catch (error) {
      throw new Error(`Erreur récupération entreprise par route: ${error.message}`);
    }
  }

  // Mettre à jour une entreprise
  static async updateEntreprise(id, data) {
    try {
      const entreprise = await Entreprise.findByPk(id);
      if (!entreprise) {
        throw new Error('Entreprise non trouvée');
      }

      await entreprise.update(data);
      return entreprise;
    } catch (error) {
      throw new Error(`Erreur mise à jour entreprise: ${error.message}`);
    }
  }

  // Supprimer une entreprise
  static async deleteEntreprise(id) {
    try {
      const entreprise = await Entreprise.findByPk(id);
      if (!entreprise) {
        throw new Error('Entreprise non trouvée');
      }

      await entreprise.destroy();
      return { message: 'Entreprise supprimée avec succès' };
    } catch (error) {
      throw new Error(`Erreur suppression entreprise: ${error.message}`);
    }
  }
}

export default EntrepriseService;