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
          // Récupérer l'utilisateur depuis localStorage
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            // Essayer de récupérer depuis l'API
            try {
              const userData = await authAPI.getCurrentUser();
              if (userData && userData.user) {
                setUser(userData.user);
                localStorage.setItem('user', JSON.stringify(userData.user));
              }
            } catch (apiError) {
              console.error('Erreur API getCurrentUser:', apiError);
              authAPI.logout();
            }
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

  // Login - Connexion à l'API backend
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.token && response.user) {
        // Sauvegarder l'utilisateur
        const userData = {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          role: response.user.role?.name || 'utilisateur',
          roleLevel: response.user.role?.level || 1
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return { success: true, user: userData };
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    }
  };

  // Register - Inscription via l'API backend
  const register = async (userData) => {
    try {
      const response = await authAPI.register({
        username: `${userData.prenom} ${userData.nom}`,
        email: userData.email,
        password: userData.password
      });

      if (response.user) {
        // Après inscription, connecter automatiquement
        return await login(userData.email, userData.password);
      }

      return { success: true, message: response.message };
    } catch (error) {
      console.error('Erreur register:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    authAPI.logout();
    localStorage.removeItem('user');
    setUser(null);
  };

  // Vérifier si l'utilisateur est manager (level >= 5)
  const isManager = () => {
    return user?.role === 'manager' || user?.roleLevel >= 5;
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
