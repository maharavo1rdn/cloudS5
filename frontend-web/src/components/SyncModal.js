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
      addLog('Démarrage de la synchronisation bidirectionnelle...', 'info');
      setSyncProgress(10);

      // Appeler la nouvelle route de synchronisation bidirectionnelle
      addLog('Synchronisation Firebase ↔ PostgreSQL...', 'info');
      setSyncProgress(30);
      
      if (!status.firebase_available) {
        throw new Error('Firebase non disponible');
      }
      
      addLog(`Firebase disponible - ${status.pending_local_changes} modifications en attente`, 'success');
      setSyncProgress(25);

      // Étape 2: Récupération (pull) depuis Firebase
      addLog('Récupération des données depuis Firebase...', 'info');
      const pullResponse = await fetch(`${API_BASE_URL}/sync/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ since: status.last_sync_at })
      });
      
      const pullResults = await pullResponse.json();
      addLog(`Pull terminé : ${pullResults.received} éléments traités`, 'success');
      setSyncProgress(60);

      // Étape 3: Envoi (push) vers Firebase
      addLog('Envoi des modifications locales vers Firebase...', 'info');
      const pushResponse = await fetch(`${API_BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!syncResponse.ok) {
        throw new Error(`Erreur HTTP ${syncResponse.status}`);
      }
      
      const syncData = await syncResponse.json();
      
      if (!syncData.success) {
        addLog('Synchronisation terminée avec des erreurs', 'warning');
      }
      
      // Logs détaillés
      addLog(`Firebase → PostgreSQL : ${syncData.firebase_to_postgres.created_signalements} signalements créés`, 'success');
      addLog(`Firebase → PostgreSQL : ${syncData.firebase_to_postgres.created_points} points créés`, 'success');
      setSyncProgress(70);
      
      addLog(`PostgreSQL → Firebase : ${syncData.postgres_to_firebase.created_firebase} signalements créés`, 'success');
      setSyncProgress(90);
      
      // Afficher les erreurs s'il y en a
      if (syncData.firebase_to_postgres.errors.length > 0) {
        addLog(`${syncData.firebase_to_postgres.errors.length} erreurs lors de Firebase → PostgreSQL`, 'warning');
      }
      if (syncData.postgres_to_firebase.errors.length > 0) {
        addLog(`${syncData.postgres_to_firebase.errors.length} erreurs lors de PostgreSQL → Firebase`, 'warning');
      }

      // Finalisation
      setSyncResults({
        pull: pullResults,
        push: pushResults,
        // Mock des objets manquants dans la logique originale pour éviter les crashs UI si l'API ne les renvoie pas
        users_pull: pullResults.users_pull || { received: 0, created: 0, updated: 0 },
        users_push: pushResults.users_push || { total: 0, created: 0, updated: 0 },
        images_histo: pushResults.images_histo || { images: { pulled: 0, pushed: 0 }, historique: { pulled: 0, pushed: 0 } },
        timestamp: new Date().toISOString()
      });
      
      addLog('Synchronisation bidirectionnelle terminée.', 'success');
      setSyncState('success');
      setSyncProgress(100);
      
      // Recharger la page après 2 secondes pour afficher les nouvelles données
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      addLog(`Erreur: ${error.message}`, 'error');
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
            <Cloud className="header-icon" />
            <span>Synchronisation Cloud</span>
          </div>
          <button onClick={onClose} className="close-btn" disabled={syncState === 'syncing'}>
            <X size={20} />
          </button>
        </div>

        <div className="sync-modal-body">
          
          {/* ÉTAT : IDLE (Accueil) */}
          {syncState === 'idle' && (
            <div className="state-view idle-view">
              <div className="hero-section">
                <div className="hero-icon-circle">
                  <ArrowRightLeft size={32} />
                </div>
                <h2>Prêt à synchroniser ?</h2>
                <p>Mise à jour des données locales et envoi des modifications vers le serveur.</p>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <Database className="card-icon blue" />
                  <div>
                    <h4>Données Points</h4>
                    <span>Import/Export signalements</span>
                  </div>
                </div>
                <div className="info-card">
                  <Users className="card-icon green" />
                  <div>
                    <h4>Utilisateurs</h4>
                    <span>Sync des profils</span>
                  </div>
                </div>
                <div className="info-card">
                  <ImageIcon className="card-icon purple" />
                  <div>
                    <h4>Médias</h4>
                    <span>Galerie photos</span>
                  </div>
                </div>
                <div className="info-card">
                  <FileClock className="card-icon orange" />
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

          {/* ÉTAT : SYNCING (En cours) */}
          {syncState === 'syncing' && (
            <div className="state-view syncing-view">
              <div className="progress-container">
                <div className="spinner-wrapper">
                  <RefreshCw className="spinning-icon" size={48} />
                </div>
                <h3>Synchronisation en cours...</h3>
                <span className="progress-percent">{syncProgress}%</span>
              </div>
              
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* ÉTAT : RÉSULTATS (Succès/Erreur) */}
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
                    <Database size={16} className="text-blue" /> <span>Points</span>
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
                    <Users size={16} className="text-green" /> <span>Utilisateurs</span>
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
                    <ImageIcon size={16} className="text-purple" /> <span>Images</span>
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
                    <FileClock size={16} className="text-orange" /> <span>Historique</span>
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