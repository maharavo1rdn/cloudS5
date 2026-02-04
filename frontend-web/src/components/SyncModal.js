import React, { useState } from 'react';
import { 
  RefreshCw, 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Cloud, 
  Database, 
  Users, 
  Image as ImageIcon, 
  FileClock, 
  Server,
  ArrowRightLeft
} from 'lucide-react';
import './SyncModal.css';

const SyncModal = ({ isOpen, onClose }) => {
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, success, error
  const [syncResults, setSyncResults] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
  const API_BASE_URL = 'http://localhost:3000/api';

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const startSync = async () => {
    setSyncState('syncing');
    setSyncProgress(0);
    setLogs([]);
    setSyncResults(null);

    try {
      addLog('Démarrage de la synchronisation...', 'info');
      setSyncProgress(10);

      // Étape 1: Vérifier le statut
      addLog('Vérification du statut Firebase...', 'info');
      const statusResponse = await fetch(`${API_BASE_URL}/sync/status`);
      
      if (!statusResponse.ok) throw new Error('Impossible de contacter le serveur de statut');
      
      const status = await statusResponse.json();
      
      if (!status.firebase_available) {
        throw new Error('Firebase non disponible');
      }
      
      addLog(`Firebase disponible - ${status.pending_local_changes} modifications en attente`, 'success');
      setSyncProgress(25);

      // Étape 2: Récupération (pull) depuis Firebase
      addLog('Récupération des données (Pull)...', 'info');
      const fullResponse = await fetch(`${API_BASE_URL}/sync/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });

      if (!fullResponse.ok) {
        throw new Error(`Erreur lors de la synchro complète (HTTP ${fullResponse.status})`);
      }

      const syncData = await fullResponse.json();
      setSyncProgress(70);

      // Logs détaillés
      if (syncData.pull) {
         addLog(`Points reçus: ${syncData.pull.received} (Créés: ${syncData.pull.created}, MAJ: ${syncData.pull.updated})`, 'success');
      }
      if (syncData.push) {
         addLog(`Points envoyés: ${syncData.push.total} traités`, 'success');
      }
      
      // Finalisation des résultats
      setSyncResults({
        pull: syncData.pull || { received: 0, created: 0, updated: 0 },
        push: syncData.push || { total: 0, created: [], updated: [] },
        users_pull: syncData.users_pull || { received: 0, created: 0, updated: 0 },
        users_push: syncData.users_push || { total: 0, created: 0, updated: 0 },
        images_histo: syncData.images_histo || { images: { pulled: 0, pushed: 0 }, historique: { pulled: 0, pushed: 0 } },
        timestamp: new Date().toISOString()
      });
      
      addLog('Synchronisation terminée avec succès.', 'success');
      setSyncState('success');
      setSyncProgress(100);

      // Optionnel : Recharger la page après succès
      // setTimeout(() => window.location.reload(), 2000);

    } catch (error) {
      addLog(`Erreur critique: ${error.message}`, 'error');
      setSyncState('error');
      console.error('Erreur synchronisation:', error);
    }
  };

  const resetSync = () => {
    setSyncState('idle');
    setSyncProgress(0);
    setLogs([]);
    setSyncResults(null);
  };

  if (!isOpen) return null;

  return (
    <div className="sync-modal-overlay">
      <div className="sync-modal-container">
        
        {/* Header */}
        <div className="sync-modal-header">
          <div className="header-title">
            <Cloud className="header-icon" size={24} />
            <span>Synchronisation Cloud</span>
          </div>
          <button onClick={onClose} className="close-btn" disabled={syncState === 'syncing'}>
            <X size={20} />
          </button>
        </div>

        <div className="sync-modal-body">
          
          {/* VUE 1 : IDLE (Accueil) */}
          {syncState === 'idle' && (
            <div className="state-view idle-view">
              <div className="hero-section">
                <div className="hero-icon-circle">
                  <ArrowRightLeft size={32} />
                </div>
                <h2>Prêt à synchroniser ?</h2>
                <p>Cette action mettra à jour vos données locales et enverra vos modifications au serveur.</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <Database className="card-icon blue" size={20} />
                  <div>
                    <h4>Données Points</h4>
                    <span>Import/Export signalements</span>
                  </div>
                </div>
                <div className="info-card">
                  <Users className="card-icon green" size={20} />
                  <div>
                    <h4>Utilisateurs</h4>
                    <span>Sync des profils</span>
                  </div>
                </div>
                <div className="info-card">
                  <ImageIcon className="card-icon purple" size={20} />
                  <div>
                    <h4>Médias</h4>
                    <span>Galerie photos</span>
                  </div>
                </div>
                <div className="info-card">
                  <FileClock className="card-icon orange" size={20} />
                  <div>
                    <h4>Historique</h4>
                    <span>Logs d'activités</span>
                  </div>
                </div>
              </div>

              <button onClick={startSync} className="action-btn primary">
                <RefreshCw size={18} />
                Lancer la synchronisation
              </button>
            </div>
          )}

          {/* VUE 2 : SYNCING (En cours - Amélioré) */}
          {syncState === 'syncing' && (
            <div className="state-view syncing-view">
              <div className="sync-visual">
                <div className="spinner-ring">
                  <RefreshCw className="spinning-icon" size={40} />
                </div>
                <div className="progress-big-number">{syncProgress}%</div>
              </div>

              <div className="sync-text-group">
                <h3>Traitement en cours...</h3>
                <p>Veuillez ne pas fermer l'application</p>
              </div>
              
              <div className="progress-track-large">
                <div 
                  className="progress-fill-large" 
                  style={{ width: `${syncProgress}%` }}
                >
                  <div className="progress-glow"></div>
                </div>
              </div>
            </div>
          )}

          {/* VUE 3 : RÉSULTATS (Succès/Erreur) */}
          {(syncState === 'success' || syncState === 'error') && syncResults && (
            <div className="state-view results-view">
              <div className={`status-banner ${syncState}`}>
                {syncState === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                <h3>{syncState === 'success' ? 'Synchronisation réussie' : 'Erreur rencontrée'}</h3>
              </div>
              
              <div className="stats-grid">
                {/* Points */}
                <div className="stat-box">
                  <div className="stat-header">
                    <Database size={14} className="text-blue" /> <span>Points</span>
                  </div>
                  <div className="stat-row">
                    <Download size={12} /> <span className="val">{syncResults.pull?.received || 0}</span>
                  </div>
                  <div className="stat-row">
                    <Upload size={12} /> <span className="val">{syncResults.push?.total || 0}</span>
                  </div>
                </div>

                {/* Utilisateurs */}
                <div className="stat-box">
                  <div className="stat-header">
                    <Users size={14} className="text-green" /> <span>Utilisateurs</span>
                  </div>
                  <div className="stat-row">
                    <Download size={12} /> <span className="val">{syncResults.users_pull?.received || 0}</span>
                  </div>
                  <div className="stat-row">
                    <Upload size={12} /> <span className="val">{syncResults.users_push?.total || 0}</span>
                  </div>
                </div>

                {/* Images */}
                <div className="stat-box">
                  <div className="stat-header">
                    <ImageIcon size={14} className="text-purple" /> <span>Images</span>
                  </div>
                  <div className="stat-row">
                    <Download size={12} /> <span className="val">{syncResults.images_histo?.images?.pulled || 0}</span>
                  </div>
                  <div className="stat-row">
                    <Upload size={12} /> <span className="val">{syncResults.images_histo?.images?.pushed || 0}</span>
                  </div>
                </div>

                {/* Historique */}
                <div className="stat-box">
                  <div className="stat-header">
                    <FileClock size={14} className="text-orange" /> <span>Historique</span>
                  </div>
                  <div className="stat-row">
                    <Download size={12} /> <span className="val">{syncResults.images_histo?.historique?.pulled || 0}</span>
                  </div>
                  <div className="stat-row">
                    <Upload size={12} /> <span className="val">{syncResults.images_histo?.historique?.pushed || 0}</span>
                  </div>
                </div>
              </div>

              <button onClick={resetSync} className="action-btn outline">
                <RefreshCw size={16} />
                Nouvelle synchronisation
              </button>
            </div>
          )}

          {/* Console de Logs */}
          {logs.length > 0 && (
            <div className="logs-panel">
              <div className="logs-header">
                <Server size={14} />
                <span>Journal d'opérations</span>
              </div>
              <div className="logs-scroller">
                {logs.map((log, index) => (
                  <div key={index} className={`log-line ${log.type}`}>
                    <span className="ts">[{log.timestamp}]</span>
                    <span className="msg">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SyncModal;