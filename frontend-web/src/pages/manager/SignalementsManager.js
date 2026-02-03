import React, { useState } from 'react';
import { useSignalements } from '../../context/SignalementContext';
import { 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import './SignalementsManager.css';

const SignalementsManager = () => {
  const { signalements, updateSignalement, deleteSignalement, addSignalement, loading } = useSignalements();
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSignalement, setNewSignalement] = useState({
    latitude: -18.8792,
    longitude: 47.5079,
    description: '',
    adresse: '',
    surface: '',
    budget: '',
    entreprise: '',
    status: 'nouveau'
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les signalements
  const filteredSignalements = signalements.filter(s => {
    const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchesSearch = s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.adresse.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Commencer l'édition
  const startEdit = (signalement) => {
    setEditingId(signalement.id);
    setEditData({ ...signalement });
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  // Sauvegarder les modifications
  const saveEdit = async () => {
    try {
      await updateSignalement(editingId, editData);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Supprimer un signalement
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) {
      try {
        await deleteSignalement(id);
      } catch (error) {
        alert('Erreur: ' + error.message);
      }
    }
  };

  // Ajouter un nouveau signalement
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addSignalement({
        ...newSignalement,
        surface: parseFloat(newSignalement.surface) || 0,
        budget: parseFloat(newSignalement.budget) || 0
      });
      setShowAddForm(false);
      setNewSignalement({
        latitude: -18.8792,
        longitude: 47.5079,
        description: '',
        adresse: '',
        surface: '',
        budget: '',
        entreprise: '',
        status: 'nouveau'
      });
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  // Status badge
  const StatusBadge = ({ status }) => {
    const config = {
      nouveau: { icon: AlertCircle, color: '#ef4444', label: 'Nouveau' },
      en_cours: { icon: Clock, color: '#f59e0b', label: 'En cours' },
      termine: { icon: CheckCircle, color: '#22c55e', label: 'Terminé' }
    };
    const { icon: Icon, color, label } = config[status] || config.nouveau;
    return (
      <span className="status-badge" style={{ backgroundColor: color }}>
        <Icon size={14} />
        {label}
      </span>
    );
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <div>
          <h1>Gestion des Signalements</h1>
          <p>{signalements.length} signalements au total</p>
        </div>
        <button className="btn-add" onClick={() => setShowAddForm(true)}>
          <Plus size={18} />
          Nouveau Signalement
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
            className={`filter-btn ${filterStatus === 'nouveau' ? 'active' : ''}`}
            onClick={() => setFilterStatus('nouveau')}
          >
            Nouveaux
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'en_cours' ? 'active' : ''}`}
            onClick={() => setFilterStatus('en_cours')}
          >
            En cours
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'termine' ? 'active' : ''}`}
            onClick={() => setFilterStatus('termine')}
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
              <h2>Nouveau Signalement</h2>
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
                    value={newSignalement.latitude}
                    onChange={(e) => setNewSignalement({...newSignalement, latitude: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newSignalement.longitude}
                    onChange={(e) => setNewSignalement({...newSignalement, longitude: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={newSignalement.description}
                  onChange={(e) => setNewSignalement({...newSignalement, description: e.target.value})}
                  placeholder="Description du problème"
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={newSignalement.adresse}
                  onChange={(e) => setNewSignalement({...newSignalement, adresse: e.target.value})}
                  placeholder="Adresse ou lieu"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input
                    type="number"
                    value={newSignalement.surface}
                    onChange={(e) => setNewSignalement({...newSignalement, surface: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label>Budget (Ar)</label>
                  <input
                    type="number"
                    value={newSignalement.budget}
                    onChange={(e) => setNewSignalement({...newSignalement, budget: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Entreprise</label>
                <input
                  type="text"
                  value={newSignalement.entreprise}
                  onChange={(e) => setNewSignalement({...newSignalement, entreprise: e.target.value})}
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

      {/* Liste des signalements */}
      <div className="signalements-list">
        {filteredSignalements.map(signalement => (
          <div key={signalement.id} className="signalement-card">
            {editingId === signalement.id ? (
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
                      <option value="nouveau">Nouveau</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                    </select>
                  </div>
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
                  <StatusBadge status={signalement.status} />
                  <span className="card-date">{signalement.date}</span>
                </div>
                <h3 className="card-title">{signalement.description}</h3>
                <p className="card-address">{signalement.adresse}</p>
                <div className="card-details">
                  <div className="detail-item">
                    <span className="detail-label">Surface</span>
                    <span className="detail-value">{signalement.surface} m²</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Budget</span>
                    <span className="detail-value">{signalement.budget.toLocaleString()} Ar</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Entreprise</span>
                    <span className="detail-value">{signalement.entreprise || 'Non assignée'}</span>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="btn-edit" onClick={() => startEdit(signalement)}>
                    <Edit2 size={16} />
                    Modifier
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(signalement.id)}>
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {filteredSignalements.length === 0 && (
          <div className="no-results">
            Aucun signalement trouvé
          </div>
        )}
      </div>


    </div>
  );
};

export default SignalementsManager;
