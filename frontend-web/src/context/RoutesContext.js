import React, { createContext, useState, useContext, useEffect } from 'react';
import routesAPI from '../services/routesAPI';

const RoutesContext = createContext();

export const useRoutes = () => {
  const context = useContext(RoutesContext);
  if (!context) {
    throw new Error('useRoutes must be used within a RoutesProvider');
  }
  return context;
};

export const RoutesProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recapitulatif, setRecapitulatif] = useState(null);
  const [routesEnTravaux, setRoutesEnTravaux] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [problemes, setProblemes] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Charger le tableau récapitulatif
  const loadRecapitulatif = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesAPI.getTableauRecapitulatif();
      setRecapitulatif(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement du récapitulatif:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les routes en travaux
  const loadRoutesEnTravaux = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesAPI.getRoutesEnTravaux();
      setRoutesEnTravaux(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des routes en travaux:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger les statuts
  const loadStatuts = async () => {
    try {
      const data = await routesAPI.getAllStatuts();
      setStatuts(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du chargement des statuts:', err);
      throw err;
    }
  };

  // Charger les problèmes
  const loadProblemes = async () => {
    try {
      const data = await routesAPI.getProblemes();
      setProblemes(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du chargement des problèmes:', err);
      throw err;
    }
  };

  // Charger les détails d'un point
  const loadPointDetails = async (pointId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesAPI.getDetailsPoint(pointId);
      setSelectedPoint(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error(`Erreur lors du chargement du point ${pointId}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger tout au démarrage
  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecapitulatif(),
        loadStatuts(),
        loadProblemes()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Formater le budget (fonction helper)
  const formatBudget = routesAPI.formatBudget;
  const formatDate = routesAPI.formatDate;
  const formatDateTime = routesAPI.formatDateTime;

  // Valeurs du contexte
  const contextValue = {
    // États
    loading,
    error,
    recapitulatif,
    routesEnTravaux,
    statuts,
    problemes,
    selectedPoint,
    
    // Fonctions de chargement
    loadRecapitulatif,
    loadRoutesEnTravaux,
    loadStatuts,
    loadProblemes,
    loadPointDetails,
    loadAllData,
    
    // Fonctions utilitaires
    formatBudget,
    formatDate,
    formatDateTime,
    
    // Setters
    setSelectedPoint,
    clearError: () => setError(null),
    refreshData: loadAllData
  };

  // Charger les données au montage
  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <RoutesContext.Provider value={contextValue}>
      {children}
    </RoutesContext.Provider>
  );
};

export default RoutesContext;