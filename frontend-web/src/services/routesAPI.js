// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Headers par défaut
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
});

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Configuration sans credentials pour les requêtes GET simples
  const fetchOptions = {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    },
    // N'utilisez PAS credentials: 'include' à moins d'en avoir besoin
    // credentials: 'include' // COMMENTEZ ou RETIREZ cette ligne
  };
  
  try {
    const response = await fetch(url, fetchOptions);

    // Vérifier si la réponse est OK
    if (!response.ok) {
      // Si c'est une erreur 401 (non autorisé), déconnecter l'utilisateur
      if (response.status === 401) {
        removeToken();
        // Redirection seulement si on est sur une page protégée
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      // Essayer de parser le message d'erreur
      let errorMessage = 'Erreur serveur';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Si on ne peut pas parser JSON, utiliser le statut HTTP
        errorMessage = `Erreur ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    // Parser la réponse JSON
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    
    // Gestion spécifique des erreurs de réseau
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Problème de connexion au serveur. Vérifiez votre connexion internet.');
    }
    
    throw error;
  }
};
// ==================== ROUTES & POINTS API ====================
const routesAPI = {
  // ========== STATISTIQUES & RECAPITULATIF ==========
  
  /**
   * Récupérer le tableau récapitulatif complet
   */
  getTableauRecapitulatif: async () => {
    try {
      const data = await apiCall('/routes/recapitulatif');
      
      // Normaliser les données pour le frontend
      return {
        nombrePoints: data.resume_general?.total_points || 0,
        totalSurface: data.resume_general?.total_surface_m2 || 0,
        totalBudget: data.resume_general?.total_budget || 0,
        avancement: data.resume_general?.moyenne_avancement || 0,
        pointsEnCours: data.resume_general?.points_en_cours || 0,
        pointsTermines: data.resume_general?.points_termines || 0,
        pointsSansBudget: data.resume_general?.points_sans_budget || 0,
        tauxCompletion: data.evolution?.taux_completion || 0,
        
        // Détails par statut
        parStatut: data.par_statut?.map(statut => ({
          code: statut.statut,
          description: statut.description,
          nombrePoints: statut.nombre_points || 0,
          surfaceTotale: statut.surface_totale || 0,
          budgetTotal: statut.budget_total || 0,
          moyenneAvancement: statut.moyenne_avancement || 0
        })) || [],
        
        // Points récents
        pointsRecents: data.points_recents?.map(point => ({
          id: point.id,
          dateDetection: point.date_detection,
          probleme: point.probleme || 'Non spécifié',
          statut: point.statut || 'Non défini',
          surfaceM2: point.surface_m2,
          budget: point.budget,
          avancementPourcentage: point.avancement_pourcentage,
          location: point.location || null
        })) || []
      };
    } catch (error) {
      console.error('Erreur dans getTableauRecapitulatif:', error);
      throw error;
    }
  },

  // ========== POINTS/ROUTES ==========
  
  /**
   * Récupérer toutes les routes/points en travaux
   */
  getRoutesEnTravaux: async () => {
    try {
      const data = await apiCall('/routes/enTravaux');
      return data.map(point => ({
        id: point.id,
        probleme: point.probleme_nom || point.probleme?.nom || 'Inconnu',
        description: point.probleme_description || point.probleme?.description,
        surfaceM2: point.surface_m2,
        budget: point.budget,
        avancementPourcentage: point.avancement_pourcentage,
        dateDetection: point.date_detection,
        dateDebut: point.date_debut,
        dateFin: point.date_fin,
        statut: point.statut_code || point.statut?.code,
        entreprise: point.entreprise_nom || point.entreprise?.nom,
        latitude: point.latitude,
        longitude: point.longitude
      }));
    } catch (error) {
      console.error('Erreur dans getRoutesEnTravaux:', error);
      throw error;
    }
  },

  /**
   * Récupérer les détails complets d'un point
   */
  getDetailsPoint: async (pointId) => {
    try {
      const data = await apiCall(`/routes/point/${pointId}/details`);
      return {
        id: data.id,
        probleme: data.probleme?.nom || 'Inconnu',
        description: data.probleme?.description,
        dateDetection: data.date_detection,
        dateDebut: data.date_debut,
        dateFin: data.date_fin,
        statut: data.statut?.code || 'Non défini',
        statutDescription: data.statut?.description,
        surfaceM2: data.surface_m2,
        budget: data.budget,
        entreprise: data.entreprise ? {
          nom: data.entreprise.nom,
          email: data.entreprise.email,
          telephone: data.entreprise.telephone
        } : null,
        avancementPourcentage: data.avancement_pourcentage,
        latitude: data.latitude,
        longitude: data.longitude
      };
    } catch (error) {
      console.error(`Erreur dans getDetailsPoint(${pointId}):`, error);
      throw error;
    }
  },

  // ========== FILTRES PAR STATUT ==========
  
  /**
   * Récupérer les points non finis (en cours) par statut
   */
  getPointsNonFinisParStatut: async (statutId) => {
    try {
      const data = await apiCall(`/routes/points/statut/${statutId}/nonFinis`);
      return {
        statut: data.statut,
        description: data.description,
        points: data.points || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error(`Erreur dans getPointsNonFinisParStatut(${statutId}):`, error);
      throw error;
    }
  },

  /**
   * Récupérer les points finis (terminés) par statut
   */
  getPointsFinisParStatut: async (statutId) => {
    try {
      const data = await apiCall(`/routes/points/statut/${statutId}/finis`);
      return {
        statut: data.statut,
        description: data.description,
        points: data.points || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error(`Erreur dans getPointsFinisParStatut(${statutId}):`, error);
      throw error;
    }
  },

  // ========== DONNEES MAITRES ==========
  
  /**
   * Récupérer tous les statuts disponibles
   */
  getAllStatuts: async () => {
    try {
      const data = await apiCall('/routes/statuts');
      return data.map(statut => ({
        id: statut.id,
        code: statut.code,
        description: statut.description,
        niveau: statut.niveau,
        nombrePoints: statut.nombre_points || 0
      }));
    } catch (error) {
      console.error('Erreur dans getAllStatuts:', error);
      throw error;
    }
  },

  /**
   * Récupérer tous les types de problèmes
   */
  getProblemes: async () => {
    try {
      const data = await apiCall('/routes/problemes');
      return data.map(probleme => ({
        id: probleme.id,
        nom: probleme.nom,
        description: probleme.description,
        nombrePoints: probleme.nombre_points || 0
      }));
    } catch (error) {
      console.error('Erreur dans getProblemes:', error);
      throw error;
    }
  },

  /**
   * Récupérer les entreprises
   */
  getEntreprises: async () => {
    try {
      // Note: Vous devrez peut-être créer cette route backend
      const data = await apiCall('/routes/entreprises');
      return data;
    } catch (error) {
      console.error('Erreur dans getEntreprises:', error);
      throw error;
    }
  },

  /**
   * Récupérer les données de l'entreprise pour un point spécifique
   */
  getEntreprisePourPoint: async (pointId) => {
    try {
      const data = await apiCall(`/routes/${pointId}/entreprise`);
      return {
        pointId: data.point_id,
        probleme: data.probleme,
        dateDetection: data.date_detection,
        entreprise: data.entreprise
      };
    } catch (error) {
      console.error(`Erreur dans getEntreprisePourPoint(${pointId}):`, error);
      throw error;
    }
  },

  // ========== UTILITAIRES ==========
  
  /**
   * Formater un budget pour l'affichage
   */
  formatBudget: (budget) => {
    if (!budget || budget === 0) return '0 Ar';
    if (budget >= 1000000000) {
      return `${(budget / 1000000000).toFixed(2).replace('.00', '')} Mrd Ar`;
    }
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(2).replace('.00', '')} M Ar`;
    }
    if (budget >= 1000) {
      return `${(budget / 1000).toFixed(1).replace('.0', '')} k Ar`;
    }
    return `${budget.toLocaleString()} Ar`;
  },

  /**
   * Formater une date pour l'affichage
   */
  formatDate: (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Formater une date avec heure
   */
  formatDateTime: (dateString) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Tester la connexion à l'API
   */
  testConnection: async () => {
    try {
      const data = await apiCall('/routes/test-associations');
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default routesAPI;