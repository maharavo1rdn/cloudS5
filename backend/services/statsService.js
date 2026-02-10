import { Op, fn, col } from 'sequelize';
import Point from '../models/Point.js';
import PointStatut from '../models/PointStatut.js';
import Probleme from '../models/Probleme.js';
import Entreprise from '../models/Entreprise.js';

class StatsService {
  /**
   * Calculer la différence en jours entre deux dates
   * @param {Date|string} startDate - Date de début
   * @param {Date|string} endDate - Date de fin
   * @returns {number} Nombre de jours (arrondis à la journée supérieure)
   */
  static calculateDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }

  /**
   * Récupérer les points terminés avec dates de début et fin
   * @returns {Promise<Array>} Points terminés avec leurs associations
   */
  static async getTerminedPoints() {
    try {
      const termineStat = await PointStatut.findOne({ where: { code: 'TERMINE' } });

      if (!termineStat) {
        throw new Error('Statut TERMINE non trouvé');
      }

      const points = await Point.findAll({
        attributes: [
          'id',
          'date_debut',
          'date_fin',
          'probleme_id',
          'entreprise_id',
        ],
        where: {
          point_statut_id: termineStat.id,
          date_debut: { [Op.not]: null },
          date_fin: { [Op.not]: null },
        },
        include: [
          { model: Probleme, as: 'probleme', attributes: ['nom'] },
          { model: Entreprise, as: 'entreprise', attributes: ['nom'] }
        ],
        raw: false,
      });

      return points;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des points terminés: ${error.message}`);
    }
  }

  /**
   * Récupérer les points en cours avec date de début
   * @returns {Promise<Array>} Points en cours avec leurs associations
   */
  static async getInProgressPoints() {
    try {
      const enCoursStat = await PointStatut.findOne({ where: { code: 'EN_COURS' } });

      if (!enCoursStat) {
        throw new Error('Statut EN_COURS non trouvé');
      }

      const points = await Point.findAll({
        attributes: [
          'id',
          'date_debut',
          'probleme_id',
          'entreprise_id',
        ],
        where: {
          point_statut_id: enCoursStat.id,
          date_debut: { [Op.not]: null },
        },
        include: [
          { model: Probleme, as: 'probleme', attributes: ['nom'] },
          { model: Entreprise, as: 'entreprise', attributes: ['nom'] }
        ],
        raw: false,
      });

      return points;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des points en cours: ${error.message}`);
    }
  }

  /**
   * Mapper les points terminés avec leurs délais de traitement
   * @param {Array} points - Points terminés
   * @returns {Array} Points avec propriété 'days' ajoutée
   */
  static mapTerminedPointsWithDays(points) {
    return points.map(p => ({
      ...p,
      days: this.calculateDaysDifference(p.date_debut, p.date_fin)
    }));
  }

  /**
   * Mapper les points en cours avec leur durée depuis le début
   * @param {Array} points - Points en cours
   * @returns {Array} Points avec propriété 'days' ajoutée
   */
  static mapInProgressPointsWithDays(points) {
    return points.map(p => ({
      ...p,
      days: this.calculateDaysDifference(p.date_debut, new Date())
    }));
  }

  /**
   * Calculer la moyenne d'un tableau de nombres
   * @param {Array} values - Tableau de numbers
   * @returns {number} Moyenne arrondie
   */
  static calculateAverage(values) {
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }

  /**
   * Calculer les statistiques par problème
   * @param {Array} allPoints - Tous les points avec délais
   * @returns {Array} Statistiques formatées par problème
   */
  static calculateStatsByProblem(allPoints) {
    const parProbleme = {};

    allPoints.forEach(point => {
      const problemeNom = point.probleme?.nom || 'Non défini';
      if (!parProbleme[problemeNom]) {
        parProbleme[problemeNom] = { count: 0, totalDays: 0 };
      }
      parProbleme[problemeNom].count += 1;
      parProbleme[problemeNom].totalDays += point.days;
    });

    return Object.entries(parProbleme)
      .map(([probleme, data]) => ({
        probleme,
        count: data.count,
        averageDays: Math.round(data.totalDays / data.count),
      }))
      .sort((a, b) => b.averageDays - a.averageDays);
  }

  /**
   * Calculer les statistiques par entreprise
   * @param {Array} allPoints - Tous les points avec délais
   * @returns {Array} Statistiques formatées par entreprise
   */
  static calculateStatsByCompany(allPoints) {
    const parEntreprise = {};

    allPoints.forEach(point => {
      const entrepriseNom = point.entreprise?.nom || 'Non assignée';
      if (!parEntreprise[entrepriseNom]) {
        parEntreprise[entrepriseNom] = { count: 0, totalDays: 0 };
      }
      parEntreprise[entrepriseNom].count += 1;
      parEntreprise[entrepriseNom].totalDays += point.days;
    });

    return Object.entries(parEntreprise)
      .map(([entreprise, data]) => ({
        entreprise,
        count: data.count,
        averageDays: Math.round(data.totalDays / data.count),
      }))
      .sort((a, b) => b.averageDays - a.averageDays);
  }

  /**
   * Récupérer les statistiques de délai de traitement
   * Récupère tous les points, calcule les délais moyens
   * @returns {Promise<Object>} Statistiques complètes
   */
  static async getProcessingTimesStats() {
    try {
      // Récupérer les points
      const pointsTermines = await this.getTerminedPoints();
      const pointsEnCours = await this.getInProgressPoints();

      // Mapper avec les délais
      const terminedWithDays = this.mapTerminedPointsWithDays(pointsTermines);
      const inProgressWithDays = this.mapInProgressPointsWithDays(pointsEnCours);

      // Combiner tous les points
      const allPointsWithDates = [...terminedWithDays, ...inProgressWithDays];

      // Calculer les moyennes
      const terminedDays = terminedWithDays.map(p => p.days);
      const inProgressDays = inProgressWithDays.map(p => p.days);
      const allDays = allPointsWithDates.map(p => p.days);

      const averageProcessingDaysTermines = this.calculateAverage(terminedDays);
      const averageProcessingDaysEnCours = this.calculateAverage(inProgressDays);
      const averageProcessingDays = this.calculateAverage(allDays);

      // Statistiques par problème et entreprise
      const parProbleme = this.calculateStatsByProblem(allPointsWithDates);
      const parEntreprise = this.calculateStatsByCompany(allPointsWithDates);

      return {
        averageProcessingDays,
        averageProcessingDaysTermines,
        averageProcessingDaysEnCours,
        totalTermines: pointsTermines.length,
        totalEnCours: pointsEnCours.length,
        parProbleme,
        parEntreprise,
      };
    } catch (error) {
      throw new Error(`Erreur lors du calcul des statistiques de délai: ${error.message}`);
    }
  }

  /**
   * Récupérer les statistiques globales
   * @returns {Promise<Object>} Statistiques générales (routes, points, budget, surface, etc.)
   */
  static async getGeneralStats() {
    try {
      const totalRoutes = await Point.count({ distinct: true, col: 'probleme_id' });
      const totalPoints = await Point.count();

      const totaux = await Point.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
          [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
          [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
        ],
        raw: true,
      });

      const pointsParStatut = await Point.findAll({
        attributes: [
          'point_statut_id',
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['point_statut_id'],
        raw: true,
      });

      const parStatut = {};
      for (const item of pointsParStatut) {
        const statut = item.point_statut_id 
          ? await PointStatut.findByPk(item.point_statut_id) 
          : null;
        const key = statut ? statut.code.toLowerCase() : 'inconnu';
        parStatut[key] = parseInt(item.count, 10);
      }

      return {
        totalRoutes,
        totalPoints,
        totalSurface: parseFloat(totaux.totalSurface) || 0,
        totalBudget: parseFloat(totaux.totalBudget) || 0,
        avancementMoyen: Math.round(parseFloat(totaux.avancementMoyen) || 0),
        parStatut,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques générales: ${error.message}`);
    }
  }

  /**
   * Récupérer les statistiques du tableau de bord
   * @returns {Promise<Object>} Données complètes pour le dashboard
   */
  static async getDashboardStats() {
    try {
      const totalRoutes = await Point.count({ distinct: true, col: 'probleme_id' });
      const totalPoints = await Point.count();

      const totaux = await Point.findOne({
        attributes: [
          [fn('COALESCE', fn('SUM', col('surface_m2')), 0), 'totalSurface'],
          [fn('COALESCE', fn('SUM', col('budget')), 0), 'totalBudget'],
          [fn('COALESCE', fn('AVG', col('avancement_pourcentage')), 0), 'avancementMoyen'],
        ],
        raw: true,
      });

      const pointsParStatut = await Point.findAll({
        attributes: [
          'point_statut_id',
          [fn('COUNT', col('id')), 'count'],
        ],
        group: ['point_statut_id'],
        raw: true,
      });

      const pointsStatut = {};
      for (const item of pointsParStatut) {
        const statut = item.point_statut_id 
          ? await PointStatut.findByPk(item.point_statut_id) 
          : null;
        const key = statut ? statut.code.toLowerCase() : 'inconnu';
        pointsStatut[key] = parseInt(item.count, 10);
      }

      const dernieresPoints = await Point.findAll({
        order: [['created_at', 'DESC']],
        limit: 5,
        include: [
          { model: Probleme, as: 'probleme', attributes: ['nom'] },
          { model: Entreprise, as: 'entreprise', attributes: ['nom'] }
        ],
        attributes: ['id', 'surface_m2', 'budget', 'avancement_pourcentage', 'created_at'],
      });

      const parProbleme = await Point.findAll({
        attributes: [
          'probleme_id',
          [fn('COUNT', col('Point.id')), 'count'],
          [fn('SUM', col('budget')), 'totalBudget'],
        ],
        include: [{
          model: Probleme,
          as: 'probleme',
          attributes: ['nom'],
        }],
        group: ['probleme_id', 'probleme.id', 'probleme.nom'],
        raw: true,
        nest: true,
      });

      const parEntreprise = await Point.findAll({
        attributes: [
          'entreprise_id',
          [fn('COUNT', col('Point.id')), 'count'],
          [fn('SUM', col('budget')), 'totalBudget'],
        ],
        where: { entreprise_id: { [Op.not]: null } },
        include: [{
          model: Entreprise,
          as: 'entreprise',
          attributes: ['nom'],
        }],
        group: ['entreprise_id', 'entreprise.id', 'entreprise.nom'],
        raw: true,
        nest: true,
      });

      return {
        resume: {
          totalRoutes,
          totalPoints,
          totalSurface: parseFloat(totaux.totalSurface) || 0,
          totalBudget: parseFloat(totaux.totalBudget) || 0,
          avancementMoyen: Math.round(parseFloat(totaux.avancementMoyen) || 0),
        },
        parStatut: pointsStatut,
        pointsStatut,
        dernieresRoutes: dernieresPoints,
        parProbleme: parProbleme.map(p => ({
          probleme: p.probleme?.nom || 'Non défini',
          count: parseInt(p.count, 10),
          budget: parseFloat(p.totalBudget) || 0,
        })),
        parEntreprise: parEntreprise.map(e => ({
          entreprise: e.entreprise?.nom || 'Non assignée',
          count: parseInt(e.count, 10),
          budget: parseFloat(e.totalBudget) || 0,
        })),
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques du dashboard: ${error.message}`);
    }
  }
}

export default StatsService;
