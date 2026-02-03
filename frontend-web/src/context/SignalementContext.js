import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockSignalements, calculateRecapitulatif, simulateDelay } from '../services/mockData';

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

  // Charger les signalements
  const loadSignalements = async () => {
    setLoading(true);
    setError(null);
    try {
      await simulateDelay(300);
      // Charger depuis localStorage si disponible et non vide, sinon mock
      const saved = localStorage.getItem('signalements');
      let data = mockSignalements; // Par défaut, utiliser les données mock
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Utiliser localStorage seulement si c'est un tableau non vide
          if (Array.isArray(parsed) && parsed.length > 0) {
            data = parsed;
          }
        } catch (e) {
          console.log('localStorage invalide, utilisation des données mock');
        }
      }
      
      console.log('Signalements chargés:', data.length, 'points');
      setSignalements(data);
      setRecapitulatif(calculateRecapitulatif(data));
    } catch (err) {
      setError('Erreur lors du chargement des signalements');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder dans localStorage
  const saveToStorage = (data) => {
    localStorage.setItem('signalements', JSON.stringify(data));
  };

  // Ajouter un signalement
  const addSignalement = async (signalementData) => {
    try {
      await simulateDelay(200);
      const newSignalement = {
        ...signalementData,
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'nouveau'
      };
      const updated = [...signalements, newSignalement];
      setSignalements(updated);
      setRecapitulatif(calculateRecapitulatif(updated));
      saveToStorage(updated);
      return newSignalement;
    } catch (err) {
      throw new Error('Erreur lors de l\'ajout du signalement');
    }
  };

  // Mettre à jour un signalement
  const updateSignalement = async (id, updates) => {
    try {
      await simulateDelay(200);
      const updated = signalements.map(s => 
        s.id === id ? { ...s, ...updates } : s
      );
      setSignalements(updated);
      setRecapitulatif(calculateRecapitulatif(updated));
      saveToStorage(updated);
      return updated.find(s => s.id === id);
    } catch (err) {
      throw new Error('Erreur lors de la mise à jour du signalement');
    }
  };

  // Supprimer un signalement
  const deleteSignalement = async (id) => {
    try {
      await simulateDelay(200);
      const updated = signalements.filter(s => s.id !== id);
      setSignalements(updated);
      setRecapitulatif(calculateRecapitulatif(updated));
      saveToStorage(updated);
    } catch (err) {
      throw new Error('Erreur lors de la suppression du signalement');
    }
  };

  // Modifier le statut
  const updateStatus = async (id, newStatus) => {
    return updateSignalement(id, { status: newStatus });
  };

  // Synchronisation Firebase (mock)
  const syncWithFirebase = async () => {
    try {
      setLoading(true);
      await simulateDelay(1000);
      // Simuler une synchronisation
      console.log('Synchronisation avec Firebase effectuée');
      return { success: true, message: 'Synchronisation réussie' };
    } catch (err) {
      throw new Error('Erreur lors de la synchronisation');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer depuis Firebase (mock)
  const fetchFromFirebase = async () => {
    try {
      setLoading(true);
      await simulateDelay(1000);
      // Simuler la récupération de nouveaux signalements
      const firebaseSignalements = [
        {
          id: Date.now(),
          latitude: -18.8800,
          longitude: 47.5180,
          date: new Date().toISOString().split('T')[0],
          status: 'nouveau',
          surface: 100,
          budget: 0,
          entreprise: null,
          description: 'Signalement depuis mobile',
          adresse: 'Rue inconnue'
        }
      ];
      const updated = [...signalements, ...firebaseSignalements];
      setSignalements(updated);
      setRecapitulatif(calculateRecapitulatif(updated));
      saveToStorage(updated);
      return { success: true, count: firebaseSignalements.length };
    } catch (err) {
      throw new Error('Erreur lors de la récupération depuis Firebase');
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
