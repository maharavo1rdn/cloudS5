import React, { useState } from 'react';
import { usePoints } from '../../context/PointContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle,
  History,
  TrendingUp
} from 'lucide-react';
import './PointsManager.css';

const PointsManager = () => {
  const { points, updatePoint, deletePoint, addPoint } = usePoints();
  const { isManager } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [newPoint, setNewPoint] = useState({
    latitude: -18.8792,
    longitude: 47.5079,
    description: '',
    adresse: '',
    surface: '',
    budget: '',
    entreprise: '',
    status: 'A_FAIRE',
    date_debut: '',
    date_fin: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les points
  const filteredPoints = points.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Commencer l'édition
  const startEdit = (point) => {
    setEditingId(point.id);
    setEditData({ ...point });
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Sauvegarder les modifications
  const saveEdit = async () => {
    try {
      await updatePoint(editingId, editData);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Supprimer un point
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce point ?')) {
      try {
        await deletePoint(id);
      } catch (error) {
        alert('Erreur: ' + error.message);
      }
    }
  };

  // Ajouter un nouveau point
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addPoint({
        ...newPoint,
        surface: parseFloat(newPoint.surface) || 0,
        budget: parseFloat(newPoint.budget) || 0
      });
      setShowAddForm(false);
      setNewPoint({
        latitude: -18.8792,
        longitude: 47.5079,
        description: '',
        adresse: '',
        surface: '',
        budget: '',
        entreprise: '',
        status: 'A_FAIRE',
        date_debut: '',
        date_fin: ''
      });
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Calculer le pourcentage d'avancement selon le statut
  const getAvancementPourcentage = (status) => {
    const statusMap = {
      'A_FAIRE': 0,
      'EN_COURS': 50,
      'TERMINE': 100
    };
    return statusMap[status] || 0;
  };

  // Charger l'historique d'un point
  const loadHistory = async (pointId) => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/points/${pointId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'historique');
      }
      
      const data = await response.json();
      setHistorique(data.historiques || []);
      setSelectedPoint(data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement de l\'historique');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Status badge avec pourcentage
  const StatusBadge = ({ status, showPercentage = false }) => {
    const config = {
      A_FAIRE: { icon: AlertCircle, color: '#ef4444', label: 'À faire' },
      EN_COURS: { icon: Clock, color: '#f59e0b', label: 'En cours' },
      TERMINE: { icon: CheckCircle, color: '#22c55e', label: 'Terminé' }
    };
    const { icon: Icon, color, label } = config[status] || config.A_FAIRE;
    const percentage = getAvancementPourcentage(status);
    
    return (
      <span className="status-badge" style={{ backgroundColor: color }}>
        <Icon size={14} />
        {label}
        {showPercentage && <span className="status-percentage">{percentage}%</span>}
      </span>
    );
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h1>Gestion des Points</h1>
          <p>{points.length} points au total</p>
        </div>
        <button className="btn-add" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          Nouveau Point
        </button>
      </div>

      {/* Filtres */}
      <div className="manager-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tous
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'A_FAIRE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('A_FAIRE')}
          >
            À faire
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'EN_COURS' ? 'active' : ''}`}
            onClick={() => setFilterStatus('EN_COURS')}
          >
            En cours
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'TERMINE' ? 'active' : ''}`}
            onClick={() => setFilterStatus('TERMINE')}
          >
            Terminés
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nouveau Point</h2>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="add-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newPoint.latitude}
                    onChange={(e) => setNewPoint({...newPoint, latitude: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newPoint.longitude}
                    onChange={(e) => setNewPoint({...newPoint, longitude: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({...newPoint, description: e.target.value})}
                  placeholder="Description du problème"
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={newPoint.adresse}
                  onChange={(e) => setNewPoint({...newPoint, adresse: e.target.value})}
                  placeholder="Adresse ou lieu"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input
                    type="number"
                    value={newPoint.surface}
                    onChange={(e) => setNewPoint({...newPoint, surface: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Budget (Ar)</label>
                  <input
                    type="number"
                    value={newPoint.budget}
                    onChange={(e) => setNewPoint({...newPoint, budget: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date début</label>
                  <input
                    type="date"
                    value={newPoint.date_debut}
                    onChange={(e) => setNewPoint({...newPoint, date_debut: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date fin</label>
                  <input
                    type="date"
                    value={newPoint.date_fin}
                    onChange={(e) => setNewPoint({...newPoint, date_fin: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Entreprise</label>
                <input
                  type="text"
                  value={newPoint.entreprise}
                  onChange={(e) => setNewPoint({...newPoint, entreprise: e.target.value})}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-save">
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des points */}
      <div className="points-list">
        {filteredPoints.map(point => (
          <div key={point.id} className="point-card">
            {editingId === point.id ? (
              // Mode édition
              <div className="edit-mode">
                <div className="form-row">
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={editData.description}
                      onChange={(e) => setEditData({...editData, description: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                    >
                      <option value="A_FAIRE">À faire</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINE">Terminé</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Date de modification</label>
                  <input
                    type="datetime-local"
                    value={editData.date_modification || ''}
                    onChange={(e) => setEditData({...editData, date_modification: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Commentaire</label>
                  <textarea
                    value={editData.commentaire || ''}
                    onChange={(e) => setEditData({...editData, commentaire: e.target.value})}
                    placeholder="Raison du changement de statut..."
                    rows="3"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Surface (m²)</label>
                    <input
                      type="number"
                      value={editData.surface}
                      onChange={(e) => setEditData({...editData, surface: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget (Ar)</label>
                    <input
                      type="number"
                      value={editData.budget}
                      onChange={(e) => setEditData({...editData, budget: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date début</label>
                    <input
                      type="date"
                      value={editData.date_debut || ''}
                      onChange={(e) => setEditData({...editData, date_debut: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date fin</label>
                    <input
                      type="date"
                      value={editData.date_fin || ''}
                      onChange={(e) => setEditData({...editData, date_fin: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Entreprise</label>
                  <input
                    type="text"
                    value={editData.entreprise || ''}
                    onChange={(e) => setEditData({...editData, entreprise: e.target.value})}
                  />
                </div>
                <div className="edit-actions">
                  <button className="btn-cancel-small" onClick={cancelEdit}>
                    <X size={16} />
                    Annuler
                  </button>
                  <button className="btn-save-small" onClick={saveEdit}>
                    <Save size={16} />
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage
              <>
                <div className="card-header">
                  <StatusBadge status={point.status} showPercentage={true} />
                  <span className="card-date">{point.date}</span>
                </div>
                <h3 className="card-title">{point.description}</h3>
                <p className="card-address">{point.adresse}</p>
                
                {/* Barre de progression */}
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${getAvancementPourcentage(point.status)}%`,
                        backgroundColor: 
                          point.status === 'nouveau' || point.status === 'NOUVEAU' ? '#ef4444' :
                          point.status === 'en_cours' || point.status === 'EN_COURS' ? '#f59e0b' :
                          '#22c55e'
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    <TrendingUp size={14} />
                    {getAvancementPourcentage(point.status)}%
                  </span>
                </div>

                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Surface</span>
                    <span className="detail-value">{point.surface} m²</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Budget</span>
                    <span className="detail-value">{point.budget.toLocaleString()} Ar</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Entreprise</span>
                    <span className="detail-value">{point.entreprise || 'Non assignée'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  {isManager() && (
                    <>
                      <button className="btn-edit" onClick={() => startEdit(point)}>
                        <Edit2 size={16} />
                        Modifier
                      </button>
                    </>
                  )}
                  <button className="btn-history" onClick={() => loadHistory(point.id)}>
                    <History size={16} />
                    Historique
                  </button>
                  {isManager() && (
                    <button className="btn-delete" onClick={() => handleDelete(point.id)}>
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {filteredPoints.length === 0 && (
          <div className="no-results">
            Aucun point trouvé
          </div>
        )}
      </div>

      {/* Modal Historique */}
      {showHistoryModal && selectedPoint && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>Historique - {selectedPoint.description}</h2>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="history-content">
              {loadingHistory ? (
                <p>Chargement...</p>
              ) : historique && historique.length > 0 ? (
                <div className="history-timeline">
                  {historique.map((entry, index) => (
                    <div key={index} className="history-entry">
                      <div className="history-dot"></div>
                      <div className="history-card">
                        <div className="history-header">
                          <div className="history-status-change">
                            <StatusBadge status={entry.ancien_statut} />
                            <span className="history-arrow">→</span>
                            <StatusBadge status={entry.nouveau_statut} />
                          </div>
                          <span className="history-date">{formatDate(entry.date_modification)}</span>
                        </div>
                        <div className="history-progress">
                          <span className="progress-change">
                            {entry.ancien_avancement}% → {entry.nouveau_avancement}%
                          </span>
                        </div>
                        {entry.user && (
                          <div className="history-user">
                            Par: {entry.user.nom} {entry.user.prenom}
                          </div>
                        )}
                        {entry.commentaire && (
                          <div className="history-comment">
                            {entry.commentaire}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-history">Aucun historique de modification</p>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default PointsManager;
