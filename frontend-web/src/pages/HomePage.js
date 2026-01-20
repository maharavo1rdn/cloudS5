import React from 'react';
import MapView from '../components/map/MapView';
import RecapTable from '../components/recap/RecapTable';
import { useAuth } from '../context/AuthContext';
import { useSignalements } from '../context/SignalementContext';
import { RefreshCw, Download, CloudUpload } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const { user, isManager } = useAuth();
  const { syncWithFirebase, fetchFromFirebase, loading } = useSignalements();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetchFromFirebase();
      await syncWithFirebase();
      alert('Synchronisation réussie !');
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="home-page">
      {/* Info bar */}
      <div className="info-bar">
        <div className="info-bar-content">
          <h2>Carte des travaux routiers</h2>
          <p>Visualisez les problèmes routiers signalés sur Antananarivo</p>
        </div>

        {/* Bouton sync visible seulement pour le manager */}
        {user && isManager() && (
          <div className="manager-actions">
            <button 
              className="btn-sync"
              onClick={handleSync}
              disabled={syncing || loading}
            >
              {syncing ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <CloudUpload size={18} />
                  Synchroniser Firebase
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Carte */}
      <section className="map-section">
        <MapView />
      </section>

      {/* Tableau récapitulatif */}
      <section className="recap-section">
        <RecapTable />
      </section>

      {/* Footer info */}
      <div className="home-footer">
        <p>
          Survolez les points sur la carte pour voir les détails • 
          Les données sont synchronisées avec Firebase pour l'application mobile
        </p>
      </div>
    </div>
  );
};

export default HomePage;
