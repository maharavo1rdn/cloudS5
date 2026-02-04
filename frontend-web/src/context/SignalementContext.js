import React, { createContext, useContext, useState, useEffect } from 'react';
import { signalementsAPI } from '../services/api';
import { calculateRecapitulatif } from '../services/mockData';

const SignalementContext = createContext(null);

export const useSignalements = () => {
  const context = useContext(SignalementContext);
  if (!context) {
    throw new Error('useSignalements must be used within a SignalementProvider');
  }
  return context;
};

export const SignalementProvider = ({ children }) => {
  const [signalements, setSignalements] = useState([]);
  const [recapitulatif, setRecapitulatif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les signalements au démarrage
  useEffect(() => {
    loadSignalements();
  }, []);

  // Charger les signalements depuis l'API
  const loadSignalements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await signalementsAPI.getAll();
      console.log('Signalements chargés depuis l\'API:', data.length, 'signalements');
      
      // Transformer les données pour compatibilité avec le frontend
      const transformed = data.map(s => ({
        id: s.id,
        latitude: parseFloat(s.latitude),
        longitude: parseFloat(s.longitude),
        date: s.date_detection,
        status: s.statut.toLowerCase(), // NOUVEAU -> nouveau
        surface: parseFloat(s.surface_m2) || 0,
        budget: parseFloat(s.budget) || 0,
        entreprise: s.entreprise?.nom || null,
        description: s.nom || s.probleme?.nom || 'Sans description',
        adresse: s.description || '',
        probleme: s.probleme?.nom || '',
        avancement: s.avancement_pourcentage || 0
      }));
      
      setSignalements(transformed);
      setRecapitulatif(calculateRecapitulatif(transformed));
    } catch (err) {
      setError('Erreur lors du chargement des signalements: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un signalement
  const addSignalement = async (signalementData) => {
    try {
      // Transformer les données pour l'API
      const apiData = {
        nom: signalementData.description,
        description: signalementData.adresse || '',
        latitude: signalementData.latitude,
        longitude: signalementData.longitude,
        surface_m2: signalementData.surface || 0,
        budget: signalementData.budget || 0,
        probleme_id: 1, // À adapter selon le problème sélectionné
        statut: signalementData.status.toUpperCase(), // nouveau -> NOUVEAU
        date_detection: new Date().toISOString().split('T')[0]
      };
      
      const newSignalement = await signalementsAPI.create(apiData);
      
      // Recharger les données
      await loadSignalements();
      
      return newSignalement;
    } catch (err) {
      throw new Error('Erreur lors de l\'ajout du signalement: ' + err.message);
    }
  };

  // Mettre à jour un signalement
  const updateSignalement = async (id, updates) => {
    try {
      // Transformer les données pour l'API
      const apiUpdates = {};
      if (updates.description) apiUpdates.nom = updates.description;
      if (updates.adresse) apiUpdates.description = updates.adresse;
      if (updates.status) apiUpdates.statut = updates.status.toUpperCase();
      if (updates.surface) apiUpdates.surface_m2 = updates.surface;
      if (updates.budget) apiUpdates.budget = updates.budget;
      if (updates.latitude) apiUpdates.latitude = updates.latitude;
      if (updates.longitude) apiUpdates.longitude = updates.longitude;
      if (updates.date_modification) apiUpdates.date_modification = updates.date_modification;
      if (updates.commentaire) apiUpdates.commentaire = updates.commentaire;
      
      await signalementsAPI.update(id, apiUpdates);
      
      // Recharger les données
      await loadSignalements();
      
      return signalements.find(s => s.id === id);
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour du signalement: ' + err.message);
    }
  };

  // Supprimer un signalement
  const deleteSignalement = async (id) => {
    try {
      await signalementsAPI.delete(id);
      
      // Recharger les données
      await loadSignalements();
    } catch (err) {
      throw new Error('Erreur lors de la suppression du signalement: ' + err.message);
    }
  };

  // Modifier le statut
  const updateStatus = async (id, newStatus) => {
    return updateSignalement(id, { status: newStatus });
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
      await loadSignalements();
      return { success: true, count: 0 };
    } catch (err) {
      throw new Error('Erreur lors de la récupération depuis Firebase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    signalements,
    recapitulatif,
    loading,
    error,
    loadSignalements,
    addSignalement,
    updateSignalement,
    deleteSignalement,
    updateStatus,
    syncWithFirebase,
    fetchFromFirebase
  };

  return (
    <SignalementContext.Provider value={value}>
      {children}
    </SignalementContext.Provider>
  );
};

export default SignalementContext;
