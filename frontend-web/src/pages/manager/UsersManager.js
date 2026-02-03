import React, { useState, useEffect } from 'react';
import { mockUsers, simulateDelay } from '../../services/mockData';
import { 
  User, 
  Lock, 
  Unlock, 
  Search,
  Shield,
  AlertTriangle
} from 'lucide-react';
import './UsersManager.css';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBlocked, setFilterBlocked] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // State pour la création d'utilisateur
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('utilisateur');

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await (await import('../../services/api')).usersAPI.getAll();
      // Normaliser les champs pour l'affichage
      const normalized = data.map(u => ({
        id: u.id,
        username: u.username || `${u.prenom || ''} ${u.nom || ''}`.trim(),
        email: u.email,
        blocked: u.isBlocked || false,
        role: u.role ? u.role.name : (u.role || 'utilisateur'),
        createdAt: u.createdAt || u.created_at || (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '')
      }));
      setUsers(normalized);
    } catch (err) {
      console.error('Erreur en chargeant les utilisateurs:', err);
      alert('Erreur récupération utilisateurs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Débloquer un utilisateur via API
  const handleUnblock = async (userId) => {
    try {
      await (await import('../../services/api')).usersAPI.unblock(userId);
      await loadUsers();
    } catch (err) {
      console.error('Erreur unblock:', err);
      alert('Erreur: ' + err.message);
    }
  };

  // Bloquer un utilisateur via API
  const handleBlock = async (userId) => {
    const reason = window.prompt('Raison du blocage:');
    if (reason) {
      try {
        await (await import('../../services/api')).usersAPI.block(userId);
        // Optionnel: you could store reason via separate endpoint; for now reload
        await loadUsers();
      } catch (err) {
        console.error('Erreur block:', err);
        alert('Erreur: ' + err.message);
      }
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(u => {
    // Exclure les managers du filtrage
    if (u.role === 'manager') return false;
    
    const matchesBlocked = filterBlocked === 'all' || 
      (filterBlocked === 'blocked' && u.blocked) ||
      (filterBlocked === 'active' && !u.blocked);
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBlocked && matchesSearch;
  });

  const blockedCount = users.filter(u => u.blocked && u.role !== 'manager').length;
  const activeCount = users.filter(u => !u.blocked && u.role !== 'manager').length;

  if (loading) {
    return <div className="loading">Chargement des utilisateurs...</div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérez les utilisateurs bloqués et actifs</p>
        </div>
        <div className="users-actions">
          <button className="btn-add" onClick={() => setShowCreate(true)}>
            <Shield size={16} />
            Créer utilisateur
          </button>
        </div>

        {/* Formulaire de création (modal inline simple) */}
        {showCreate && (
          <div className="create-modal">
            <h3>Créer un utilisateur</h3>
            <div className="form-row">
              <input placeholder="Nom complet" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
              <input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <input placeholder="Mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="utilisateur">utilisateur</option>
                <option value="manager">manager</option>
              </select>
            </div>
            <div className="form-actions">
              <button onClick={async () => {
                try {
                  if (!newUsername || !newEmail || !newPassword) { alert('Tous les champs sont requis'); return; }
                  await (await import('../../services/api')).usersAPI.create({ username: newUsername, email: newEmail, password: newPassword, role: newRole });
                  alert('Utilisateur créé');
                  setShowCreate(false);
                  setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('utilisateur');
                  await loadUsers();
                } catch (err) {
                  console.error('Erreur création:', err);
                  alert('Erreur: ' + err.message);
                }
              }}>Créer</button>
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="users-stats">
        <div className="stat-card active">
          <User size={24} />
          <div>
            <span className="stat-value">{activeCount}</span>
            <span className="stat-label">Utilisateurs actifs</span>
          </div>
        </div>
        <div className="stat-card blocked">
          <Lock size={24} />
          <div>
            <span className="stat-value">{blockedCount}</span>
            <span className="stat-label">Utilisateurs bloqués</span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="users-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterBlocked === 'all' ? 'active' : ''}`}
            onClick={() => setFilterBlocked('all')}
          >
            Tous
          </button>
          <button 
            className={`filter-btn ${filterBlocked === 'active' ? 'active' : ''}`}
            onClick={() => setFilterBlocked('active')}
          >
            Actifs
          </button>
          <button 
            className={`filter-btn ${filterBlocked === 'blocked' ? 'active' : ''}`}
            onClick={() => setFilterBlocked('blocked')}
          >
            Bloqués
          </button>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="users-list">
        {filteredUsers.map(user => (
          <div key={user.id} className={`user-card ${user.blocked ? 'blocked' : ''}`}>
            <div className="user-avatar">
              {user.blocked ? <Lock size={24} /> : <User size={24} />}
            </div>
            <div className="user-info">
              <h3>{user.username}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-date">Inscrit le {user.createdAt}</p>
              {user.blocked && (
                <div className="blocked-reason">
                  <AlertTriangle size={14} />
                  Compte bloqué
                </div>
              )}
            </div>
            <div className="user-actions">
              {user.blocked ? (
                <button className="btn-unblock" onClick={() => handleUnblock(user.id)}>
                  <Unlock size={16} />
                  Débloquer
                </button>
              ) : (
                <button className="btn-block" onClick={() => handleBlock(user.id)}>
                  <Lock size={16} />
                  Bloquer
                </button>
              )}
              <button className="btn-edit" onClick={async () => {
                const newUsername = window.prompt('Nouveau nom complet:', user.username);
                if (!newUsername) return;
                const newEmail = window.prompt('Nouvel email:', user.email);
                if (!newEmail) return;
                const newRole = window.prompt('Rôle (utilisateur|manager):', user.role || 'utilisateur');
                try {
                  await (await import('../../services/api')).usersAPI.update(user.id, { username: newUsername, email: newEmail, role: newRole });
                  alert('Utilisateur mis à jour');
                  await loadUsers();
                } catch (err) {
                  console.error('Erreur mise à jour:', err);
                  alert('Erreur: ' + err.message);
                }
              }}>
                Modifier
              </button>
              <button className="btn-delete" onClick={async () => {
                if (window.confirm('Supprimer cet utilisateur ?')) {
                  try {
                    await (await import('../../services/api')).usersAPI.delete(user.id);
                    alert('Utilisateur supprimé');
                    await loadUsers();
                  } catch (err) {
                    console.error('Erreur suppression:', err);
                    alert('Erreur: ' + err.message);
                  }
                }
              }}>
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="no-results">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManager;
