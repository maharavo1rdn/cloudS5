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
      addLog('Démarrage de la synchronisation...', 'info');
      setSyncProgress(10);

      // Étape 1: Vérifier le statut
      addLog('Vérification du statut Firebase...', 'info');
      const statusResponse = await fetch(`${API_BASE_URL}/sync/status`);
      const status = await statusResponse.json();
      
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
      addLog(`Pull terminé : ${pullResults.received} éléments traités, ${pullResults.created} créés, ${pullResults.updated} mis à jour`, 'success');
      setSyncProgress(60);

      // Étape 3: Envoi (push) vers Firebase
      addLog('Envoi des modifications locales vers Firebase...', 'info');
      const pushResponse = await fetch(`${API_BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const pushResults = await pushResponse.json();
      addLog(`Push terminé : ${pushResults.created.length} créés, ${pushResults.updated.length} mis à jour`, 'success');
      setSyncProgress(90);

      // Finalisation
      setSyncResults({
        pull: pullResults,
        push: pushResults,
        timestamp: new Date().toISOString()
      });
      
      addLog('Synchronisation terminée avec succès.', 'success');
      setSyncState('success');
      setSyncProgress(100);

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
                  <h4><Download /> Données reçues</h4>
                  <p>{syncResults.pull?.received || 0} éléments traités</p>
                  <p>{syncResults.pull?.created || 0} nouveaux créés</p>
                  <p>{syncResults.pull?.updated || 0} mis à jour</p>
                </div>
                
                <div className="stat-group">
                  <h4><Upload /> Données envoyées</h4>
                  <p>{syncResults.push?.total || 0} modifications traitées</p>
                  <p>{syncResults.push?.created?.length || 0} nouveaux créés</p>
                  <p>{syncResults.push?.updated?.length || 0} mis à jour</p>
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