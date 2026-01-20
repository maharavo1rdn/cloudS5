import Probleme from '../models/Probleme.js';
import Route from '../models/Route.js';

class ProblemeService {
  // Créer un problème
  static async createProbleme(data) {
    try {
      return await Probleme.create(data);
    } catch (error) {
      throw new Error(`Erreur création problème: ${error.message}`);
    }
  }

  // Récupérer tous les problèmes avec nombre de routes associées
  static async getAllProblemes() {
    try {
      const problemes = await Probleme.findAll({
        attributes: {
          include: [
            [
              sequelize.literal('(SELECT COUNT(*) FROM routes WHERE routes.probleme_id = Probleme.id)'),
              'nombre_routes_associees'
            ]
          ]
        },
        order: [['nom', 'ASC']]
      });

      return problemes;
    } catch (error) {
      throw new Error(`Erreur récupération problèmes: ${error.message}`);
    }
  }

  // Récupérer un problème par ID
  static async getProblemeById(id) {
    try {
      const probleme = await Probleme.findByPk(id);
      if (!probleme) {
        throw new Error('Problème non trouvé');
      }
      return probleme;
    } catch (error) {
      throw new Error(`Erreur récupération problème: ${error.message}`);
    }
  }
}

export default ProblemeService;