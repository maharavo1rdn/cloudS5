import React, { createContext, useContext, useState, useEffect } from 'react';
import { pointsAPI } from '../services/api';
import { calculateRecapitulatif } from '../services/mockData';

const PointContext = createContext(null);

export const usePoints = () => {
  const context = useContext(PointContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointProvider');
  }
  return context;
};

export const PointProvider = ({ children }) => {
  const [points, setPoints] = useState([]);
  const [recapitulatif, setRecapitulatif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les points au démarrage
  useEffect(() => {
    loadPoints();
  }, []);

  // Charger les points depuis l'API
  const loadPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pointsAPI.getAll();
      console.log('Points chargés depuis l\'API:', data.length, 'points');
      
      // Transformer les données pour compatibilité avec le frontend
      const transformed = data.map(p => ({
        id: p.id,
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        date: p.date_detection,
        status: p.statut?.code?.toLowerCase() || 'nouveau',  // statut (alias Sequelize) et non point_statut
        surface: parseFloat(p.surface_m2) || 0,
        budget: parseFloat(p.budget) || 0,
        entreprise: p.entreprise?.nom || null,
        description: p.nom || p.probleme?.nom || 'Sans description',
        adresse: p.description || '',
        probleme: p.probleme?.nom || '',
        avancement: p.avancement_pourcentage || 0
      }));
      
      setPoints(transformed);
      setRecapitulatif(calculateRecapitulatif(transformed));
    } catch (err) {
      setError('Erreur lors du chargement des points: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un point
  const addPoint = async (pointData) => {
    try {
      // Transformer les données pour l'API
      const apiData = {
        nom: pointData.description,
        description: pointData.adresse || '',
        latitude: pointData.latitude,
        longitude: pointData.longitude,
        surface_m2: pointData.surface || 0,
        budget: pointData.budget || 0,
        probleme_id: 1, // À adapter selon le problème sélectionné
        point_statut_code: 'A_FAIRE',
        date_detection: new Date().toISOString().split('T')[0]
      };
      
      const newPoint = await pointsAPI.create(apiData);
      
      // Recharger les données
      await loadPoints();
      
      return newPoint;
    } catch (err) {
      throw new Error('Erreur lors de l\'ajout du point: ' + err.message);
    }
  };

  // Mettre à jour un point
  const updatePoint = async (id, updates) => {
    try {
      // Transformer les données pour l'API
      const apiUpdates = {};
      if (updates.description) apiUpdates.nom = updates.description;
      if (updates.adresse) apiUpdates.description = updates.adresse;
      if (updates.status) apiUpdates.point_statut_code = updates.status;
      if (updates.surface) apiUpdates.surface_m2 = updates.surface;
      if (updates.budget) apiUpdates.budget = updates.budget;
      if (updates.latitude) apiUpdates.latitude = updates.latitude;
      if (updates.longitude) apiUpdates.longitude = updates.longitude;
      if (updates.date_modification) apiUpdates.date_modification = updates.date_modification;
      if (updates.commentaire) apiUpdates.commentaire = updates.commentaire;
      if (updates.date_debut !== undefined) apiUpdates.date_debut = updates.date_debut;
      if (updates.date_fin !== undefined) apiUpdates.date_fin = updates.date_fin;
      
      await pointsAPI.update(id, apiUpdates);
      
      // Recharger les données
      await loadPoints();
      
      return points.find(p => p.id === id);
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour du point: ' + err.message);
    }
  };

  // Supprimer un point
  const deletePoint = async (id) => {
    try {
      await pointsAPI.delete(id);
      
      // Recharger les données
      await loadPoints();
    } catch (err) {
      throw new Error('Erreur lors de la suppression du point: ' + err.message);
    }
  };

  // Modifier le statut
  const updateStatus = async (id, newStatus) => {
    return updatePoint(id, { status: newStatus });
  };

  // Synchronisation Firebase
  const syncWithFirebase = async () => {
    try {
      setLoading(true);
      // À implémenter selon les besoins de synchronisation
      console.log('Synchronisation avec Firebase à implémenter');
      return { success: true, message: 'Synchronisation à implémenter' };
    } catch (err) {
      throw new Error('Erreur lors de la synchronisation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer depuis Firebase
  const fetchFromFirebase = async () => {
    try {
      setLoading(true);
      // À implémenter selon les besoins de synchronisation
      await loadPoints();
      return { success: true, count: 0 };
    } catch (err) {
      throw new Error('Erreur lors de la récupération depuis Firebase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    points,
    recapitulatif,
    loading,
    error,
    loadPoints,
    addPoint,
    updatePoint,
    deletePoint,
    updateStatus,
    syncWithFirebase,
    fetchFromFirebase
  };

  return (
    <PointContext.Provider value={value}>
      {children}
    </PointContext.Provider>
  );
};

export default PointContext;
