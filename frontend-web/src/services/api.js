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
    console.debug('[apiCall] Request:', {
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      token: getToken(),
      body: options.body ? JSON.parse(options.body) : undefined
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      }
    });
    
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = { raw: text };
    }

    console.debug('[apiCall] Response:', {
      url: `${API_BASE_URL}${endpoint}`,
      status: response.status,
      data
    });
    
    if (!response.ok) {
      throw new Error(data.message || 'Erreur serveur');
    }
    
    return data;
  } catch (error) {
    console.error('[apiCall] API Error:', error);
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

// ==================== POINTS API ====================
export const pointsAPI = {
  // Récupérer tous les points
  getAll: async () => {
    return apiCall('/points');
  },

  // Récupérer un point par ID
  getById: async (id) => {
    return apiCall(`/points/${id}`);
  },

  // Créer un nouveau point
  create: async (pointData) => {
    return apiCall('/points', {
      method: 'POST',
      body: JSON.stringify(pointData)
    });
  },

  // Mettre à jour un point
  update: async (id, pointData) => {
    return apiCall(`/points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(pointData)
    });
  },

  // Supprimer un point
  delete: async (id) => {
    return apiCall(`/points/${id}`, {
      method: 'DELETE'
    });
  },

  // Récapitulatif (stats)
  getRecapitulatif: async () => {
    return apiCall('/points/recapitulatif');
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

  // Récupérer les points depuis Firebase
  fetchFromFirebase: async () => {
    return apiCall('/sync/firebase/fetch', {
      method: 'GET'
    });
  }
};

export { getToken, setToken, removeToken };
