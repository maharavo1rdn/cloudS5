import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      if (authAPI.isAuthenticated()) {
        try {
          // Récupérer l'utilisateur depuis l'API (vérifie le token)
          const data = await authAPI.getCurrentUser();
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          console.error('Erreur lors de la vérification auth:', error);
          authAPI.logout();
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        // pas de token : ne pas utiliser les données sauvées (évite d'afficher un utilisateur obsolète)
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login (utilise l'API plutôt que le mock)
  const login = async (email, password) => {
    try {
      console.debug('[Auth] login request for', email);
      const data = await authAPI.login(email, password);
      console.debug('[Auth] login response:', data);
      // authAPI.login stocke le token en localStorage
      const userFromResponse = data.user || (await authAPI.getCurrentUser()).user;
      console.debug('[Auth] fetched user:', userFromResponse);
      const normalizedUser = {
        ...userFromResponse,
        role: typeof userFromResponse.role === 'string' ? { name: userFromResponse.role } : userFromResponse.role
      };

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (error) {
      console.error('[Auth] login error:', error);
      // Nettoyer tout état local si connexion échoue
      try { localStorage.removeItem('token'); } catch (e) {}
      try { localStorage.removeItem('user'); } catch (e) {}
      setUser(null);
      throw error;
    }
  };

  // Register (crée l'utilisateur puis se connecte)
  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      // Auto-login après inscription
      const loginResult = await authAPI.login(userData.email, userData.password);
      const userFromResponse = loginResult.user || (await authAPI.getCurrentUser()).user;
      const normalizedUser = {
        ...userFromResponse,
        role: typeof userFromResponse.role === 'string' ? { name: userFromResponse.role } : userFromResponse.role
      };

      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } catch (error) {
      throw error;
    }
  };

  // Logout
  const logout = () => {
    authAPI.logout();
    localStorage.removeItem('user');
    setUser(null);
  };

  // Vérifier si l'utilisateur est manager
  const isManager = () => {
    const role = user?.role;
    return role === 'manager' || role?.name === 'manager';
  };

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return !!user && authAPI.isAuthenticated();
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isManager,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
