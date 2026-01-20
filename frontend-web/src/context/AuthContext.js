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
          // En mode mock, on récupère depuis localStorage
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        } catch (error) {
          console.error('Erreur lors de la vérification auth:', error);
          authAPI.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      // En mode mock pour le développement
      // Simulation de différents profils
      let mockUser;
      
      if (email === 'manager@tana.mg') {
        mockUser = {
          id: 1,
          email: 'manager@tana.mg',
          nom: 'Rakoto',
          prenom: 'Jean',
          role: 'manager'
        };
      } else {
        mockUser = {
          id: 2,
          email: email,
          nom: 'Utilisateur',
          prenom: 'Test',
          role: 'utilisateur'
        };
      }

      // Simuler un token
      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);

      return { success: true, user: mockUser };
    } catch (error) {
      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    try {
      // Mode mock
      const newUser = {
        id: Date.now(),
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        role: 'utilisateur'
      };

      localStorage.setItem('token', 'mock-jwt-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);

      return { success: true, user: newUser };
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
    return user?.role === 'manager';
  };

  // Vérifier si l'utilisateur est connecté
  const isAuthenticated = () => {
    return !!user;
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
