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

// ==================== SIGNALEMENTS API ====================
export const signalementsAPI = {
  // Récupérer tous les signalements
  getAll: async () => {
    return apiCall('/signalements');
  },

  // Récupérer un signalement par ID
  getById: async (id) => {
    return apiCall(`/signalements/${id}`);
  },

  // Créer un nouveau signalement
  create: async (signalementData) => {
    return apiCall('/signalements', {
      method: 'POST',
      body: JSON.stringify(signalementData)
    });
  },

  // Mettre à jour un signalement
  update: async (id, signalementData) => {
    return apiCall(`/signalements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(signalementData)
    });
  },

  // Supprimer un signalement
  delete: async (id) => {
    return apiCall(`/signalements/${id}`, {
      method: 'DELETE'
    });
  },

  // Récapitulatif (stats)
  getRecapitulatif: async () => {
    return apiCall('/signalements/recapitulatif');
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
  },

  // Créer un utilisateur (Manager)
  create: async (userData) => {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Mettre à jour un utilisateur (Manager)
  update: async (userId, userData) => {
    return apiCall(`/users/admin/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  // Supprimer un utilisateur (Manager)
  delete: async (userId) => {
    return apiCall(`/users/admin/${userId}`, {
      method: 'DELETE'
    });
  }
};

// ==================== SYNC API (Manager - Firebase) ====================
export const syncAPI = {
  // Synchroniser avec Firebase
  syncToFirebase: async () => {
    return apiCall('/sync/firebase', {
      method: 'POST'
    });
  },

  // Récupérer les signalements depuis Firebase
  fetchFromFirebase: async () => {
    return apiCall('/sync/firebase/fetch', {
      method: 'GET'
    });
  }
};

// ==================== POINTS API ====================
export const pointsAPI = {
  // Créer un point (Manager)
  create: async (pointData) => {
    return apiCall('/points', {
      method: 'POST',
      body: JSON.stringify(pointData)
    });
  }
};

export { getToken, setToken, removeToken };
