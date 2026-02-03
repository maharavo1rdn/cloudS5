import React, { useState } from 'react';
import { RefreshCw, Upload, Download, CheckCircle, AlertTriangle, X } from 'lucide-react';
import './SyncModal.css';

const SyncModal = ({ isOpen, onClose }) => {
  const [syncState, setSyncState] = useState('idle'); // idle, syncing, success, error
  const [syncResults, setSyncResults] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  
  const API_BASE_URL = 'http://localhost:3000/api';

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
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
      
      const syncResponse = await fetch(`${API_BASE_URL}/sync-bidirectional/bidirectional`, {
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
        firebase_to_postgres: syncData.firebase_to_postgres,
        postgres_to_firebase: syncData.postgres_to_firebase,
        timestamp: syncData.completed_at
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
      <div className="sync-modal">
        <div className="sync-modal-header">
          <h2>
            <RefreshCw className={syncState === 'syncing' ? 'spinning' : ''} />
            Synchronisation Firebase
          </h2>
          <button onClick={onClose} className="close-btn">
            <X />
          </button>
        </div>

        <div className="sync-modal-content">
          {syncState === 'idle' && (
            <div className="sync-intro">
              <div className="sync-info">
                <h3>Synchronisation bidirectionnelle</h3>
                <p>Cette action va :</p>
                <ul>
                  <li><Download className="icon" /> Récupérer les dernières données depuis Firebase</li>
                  <li><Upload className="icon" /> Envoyer vos modifications locales vers Firebase</li>
                  <li><CheckCircle className="icon" /> Résoudre les conflits automatiquement</li>
                </ul>
              </div>
              <div className="sync-actions">
                <button onClick={startSync} className="sync-btn primary">
                  <RefreshCw />
                  Commencer la synchronisation
                </button>
              </div>
            </div>
          )}

          {syncState === 'syncing' && (
            <div className="sync-progress">
              <h3>Synchronisation en cours...</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{syncProgress}%</span>
            </div>
          )}

          {(syncState === 'success' || syncState === 'error') && syncResults && (
            <div className="sync-results">
              <div className={`result-header ${syncState}`}>
                {syncState === 'success' ? (
                  <><CheckCircle /> Synchronisation réussie</>
                ) : (
                  <><AlertTriangle /> Synchronisation avec erreurs</>
                )}
              </div>
              
              <div className="result-stats">
                <div className="stat-group">
                  <h4><Download /> Firebase → PostgreSQL</h4>
                  <p>{syncResults.firebase_to_postgres?.total_firebase || 0} signalements Firebase</p>
                  <p>{syncResults.firebase_to_postgres?.created_signalements || 0} signalements créés</p>
                  <p>{syncResults.firebase_to_postgres?.created_points || 0} points créés</p>
                  {syncResults.firebase_to_postgres?.errors?.length > 0 && (
                    <p className="error-count">{syncResults.firebase_to_postgres.errors.length} erreurs</p>
                  )}
                </div>
                
                <div className="stat-group">
                  <h4><Upload /> PostgreSQL → Firebase</h4>
                  <p>{syncResults.postgres_to_firebase?.total_postgres || 0} signalements PostgreSQL</p>
                  <p>{syncResults.postgres_to_firebase?.created_firebase || 0} signalements créés</p>
                  {syncResults.postgres_to_firebase?.errors?.length > 0 && (
                    <p className="error-count">{syncResults.postgres_to_firebase.errors.length} erreurs</p>
                  )}
                </div>
              </div>

              <div className="sync-actions">
                <button onClick={resetSync} className="sync-btn secondary">
                  Nouvelle synchronisation
                </button>
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="sync-logs">
              <h4>Détails de l'opération</h4>
              <div className="logs-container">
                {logs.map((log, index) => (
                  <div key={index} className={`log-entry ${log.type}`}>
                    <span className="log-time">{log.timestamp}</span>
                    <span className="log-message">{log.message}</span>
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