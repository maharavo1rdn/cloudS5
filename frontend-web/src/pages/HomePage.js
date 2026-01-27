import React from 'react';
import MapView from '../components/map/MapView';
import RecapTable from '../components/recap/RecapTable';
import { useAuth } from '../context/AuthContext';
import { useSignalements } from '../context/SignalementContext';
import { useRoutes } from '../context/RoutesContext';
import { RefreshCw, Download, CloudUpload } from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  const { user, isManager } = useAuth();
  const { syncWithFirebase, fetchFromFirebase, loading } = useSignalements();
  const { recapitulatif, loadRecapitulatif, problemes, statuts, loadRoutesEnTravaux, loadProblemes, loadStatuts } = useRoutes();
  const [syncing, setSyncing] = React.useState(false);

  // Création point (manager)
  const [showCreatePoint, setShowCreatePoint] = React.useState(false);
  const [newProblemeId, setNewProblemeId] = React.useState('');
  const [newLat, setNewLat] = React.useState('');
  const [newLon, setNewLon] = React.useState('');
  const [newSurface, setNewSurface] = React.useState('');
  const [newBudget, setNewBudget] = React.useState('');
  const [newDateDebut, setNewDateDebut] = React.useState('');
  const [newStatut, setNewStatut] = React.useState('');

  React.useEffect(() => {
    if (problemes && problemes.length > 0 && !newProblemeId) setNewProblemeId(problemes[0].id);
  }, [problemes]);

  React.useEffect(() => {
    if (statuts && statuts.length > 0 && !newStatut) setNewStatut(statuts[0].code || statuts[0].id);
  }, [statuts]);

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
          {/* Stats dynamiques */}
          {recapitulatif && (
            <div className="home-stats">
              <span>Total: <strong>{recapitulatif.nombrePoints}</strong></span>
              <span>En cours: <strong>{recapitulatif.pointsEnCours}</strong></span>
              <span>Terminés: <strong>{recapitulatif.pointsTermines}</strong></span>
            </div>
          )}
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

            <button className="btn-add-point" onClick={async () => {
              // Ensure problemes/statuts chargés
              try {
                await loadProblemes();
                await loadStatuts();
              } catch (err) { /* ignore */ }
              setShowCreatePoint(true);
            }}>
              <Download size={16} />
              Créer un point
            </button>

            {showCreatePoint && (
              <div className="create-point">
                <h4>Créer un point</h4>
                <div className="form-row">
                  <select value={newProblemeId} onChange={e => setNewProblemeId(e.target.value)}>
                    {problemes && problemes.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.nom || p.description || `#${p.id}`}</option>
                    ))}
                  </select>
                  <select value={newStatut} onChange={e => setNewStatut(e.target.value)}>
                    {statuts && statuts.map(s => (
                      <option key={s.code || s.id} value={s.code || s.id}>{s.name || s.label || s.code}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <input placeholder="Latitude" value={newLat} onChange={e => setNewLat(e.target.value)} />
                  <input placeholder="Longitude" value={newLon} onChange={e => setNewLon(e.target.value)} />
                </div>
                <div className="form-row">
                  <input placeholder="Surface (m²)" value={newSurface} onChange={e => setNewSurface(e.target.value)} />
                  <input placeholder="Budget" value={newBudget} onChange={e => setNewBudget(e.target.value)} />
                </div>
                <div className="form-row">
                  <input type="date" value={newDateDebut} onChange={e => setNewDateDebut(e.target.value)} />
                </div>
                <div className="form-actions">
                  <button onClick={async () => {
                    try {
                      if (!newProblemeId || !newLat || !newLon) { alert('Problème et coordonnées requis'); return; }
                      await (await import('../services/api')).pointsAPI.create({
                        probleme_id: newProblemeId,
                        lat: parseFloat(newLat),
                        lon: parseFloat(newLon),
                        surface_m2: newSurface ? parseFloat(newSurface) : null,
                        budget: newBudget ? parseFloat(newBudget) : null,
                        date_debut: newDateDebut || null,
                        point_statut_code: newStatut || undefined
                      });
                      alert('Point créé');
                      setShowCreatePoint(false);
                      setNewLat(''); setNewLon(''); setNewSurface(''); setNewBudget(''); setNewDateDebut('');
                      await loadRecapitulatif();
                      await loadRoutesEnTravaux();
                    } catch (err) {
                      console.error('Erreur création point:', err);
                      alert('Erreur: ' + err.message);
                    }
                  }}>Créer</button>
                  <button className="btn-cancel" onClick={() => setShowCreatePoint(false)}>Annuler</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Carte */}
      <section className="map-section">
        <MapView onMapClick={(coords) => {
          console.debug('HomePage onMapClick:', coords, 'isManager:', isManager());
          if (!isManager()) { alert('Seuls les managers peuvent créer des points.'); return; }
          if (!coords || typeof coords.lat === 'undefined') return;
          (async () => {
            try {
              await loadProblemes();
              await loadStatuts();
            } catch (err) {
              // ignore, still proceed
            }
            setNewLat(coords.lat.toFixed(6));
            setNewLon(coords.lng.toFixed(6));
            setShowCreatePoint(true);
          })();
        }} previewCoords={ showCreatePoint && newLat && newLon ? { lat: parseFloat(newLat), lng: parseFloat(newLon) } : null } />
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
