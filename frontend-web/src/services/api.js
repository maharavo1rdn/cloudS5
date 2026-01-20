// Configuration de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Token management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

// Headers par défaut
const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() && { 'Authorization': `Bearer ${getToken()}` })
});

// Fonction générique pour les appels API
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur serveur');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  login: async (email, password) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      setToken(data.token);
    }
    return data;
  },

  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  logout: () => {
    removeToken();
  },

  getCurrentUser: async () => {
    return apiCall('/auth/me');
  },

  isAuthenticated: () => {
    return !!getToken();
  }
};

// ==================== ROUTES (Travaux routiers) API ====================
export const routesAPI = {
  // Récupérer toutes les routes
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/routes?${queryString}` : '/routes';
    return apiCall(endpoint);
  },

  // Récupérer une route par ID
  getById: async (id) => {
    return apiCall(`/routes/${id}`);
  },

  // Créer une nouvelle route (Manager)
  create: async (routeData) => {
    return apiCall('/routes', {
      method: 'POST',
      body: JSON.stringify(routeData)
    });
  },

  // Mettre à jour une route (Manager)
  update: async (id, routeData) => {
    return apiCall(`/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(routeData)
    });
  },

  // Mettre à jour l'avancement (Manager)
  updateAvancement: async (id, avancement) => {
    return apiCall(`/routes/${id}/avancement`, {
      method: 'PATCH',
      body: JSON.stringify({ avancement_pourcentage: avancement })
    });
  },

  // Supprimer une route (Manager)
  delete: async (id) => {
    return apiCall(`/routes/${id}`, {
      method: 'DELETE'
    });
  }
};

// Alias pour compatibilité avec l'ancien code
export const signalementsAPI = routesAPI;

// ==================== PROBLEMES API ====================
export const problemesAPI = {
  // Récupérer tous les types de problèmes
  getAll: async () => {
    return apiCall('/problemes');
  },

  // Récupérer un problème par ID
  getById: async (id) => {
    return apiCall(`/problemes/${id}`);
  },

  // Créer un nouveau type de problème (Manager)
  create: async (problemeData) => {
    return apiCall('/problemes', {
      method: 'POST',
      body: JSON.stringify(problemeData)
    });
  },

  // Mettre à jour un problème (Manager)
  update: async (id, problemeData) => {
    return apiCall(`/problemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(problemeData)
    });
  },

  // Supprimer un problème (Manager)
  delete: async (id) => {
    return apiCall(`/problemes/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==================== ENTREPRISES API ====================
export const entreprisesAPI = {
  // Récupérer toutes les entreprises
  getAll: async () => {
    return apiCall('/entreprises');
  },

  // Récupérer une entreprise par ID
  getById: async (id) => {
    return apiCall(`/entreprises/${id}`);
  },

  // Créer une nouvelle entreprise (Manager)
  create: async (entrepriseData) => {
    return apiCall('/entreprises', {
      method: 'POST',
      body: JSON.stringify(entrepriseData)
    });
  },

  // Mettre à jour une entreprise (Manager)
  update: async (id, entrepriseData) => {
    return apiCall(`/entreprises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entrepriseData)
    });
  },

  // Supprimer une entreprise (Manager)
  delete: async (id) => {
    return apiCall(`/entreprises/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==================== STATS API ====================
export const statsAPI = {
  // Récupérer les statistiques globales
  getAll: async () => {
    return apiCall('/stats');
  },

  // Récupérer le dashboard complet
  getDashboard: async () => {
    return apiCall('/stats/dashboard');
  }
};

// ==================== USERS API (Manager) ====================
export const usersAPI = {
  // Récupérer tous les utilisateurs
  getAll: async () => {
    return apiCall('/users');
  },

  // Récupérer les utilisateurs bloqués
  getBlocked: async () => {
    return apiCall('/users/blocked');
  },

  // Débloquer un utilisateur
  unblock: async (userId) => {
    return apiCall(`/users/${userId}/unblock`, {
      method: 'PUT'
    });
  },

  // Bloquer un utilisateur
  block: async (userId) => {
    return apiCall(`/users/${userId}/block`, {
      method: 'PUT'
    });
  }
};

// ==================== SYNC API (Manager - Firebase) ====================
export const syncAPI = {
  // Statut de synchronisation
  getStatus: async () => {
    return apiCall('/sync/status');
  },

  // Exporter les données locales
  exportData: async () => {
    return apiCall('/sync/export');
  },

  // Importer des données
  importData: async (data) => {
    return apiCall('/sync/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Marquer comme synchronisé
  markSynced: async (ids) => {
    return apiCall('/sync/mark-synced', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  // Synchronisation complète
  syncAll: async () => {
    return apiCall('/sync/all', {
      method: 'POST'
    });
  }
};

export { getToken, setToken, removeToken };
