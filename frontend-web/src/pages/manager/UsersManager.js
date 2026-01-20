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

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    await simulateDelay(300);
    // Charger depuis localStorage si disponible
    const saved = localStorage.getItem('users');
    const data = saved ? JSON.parse(saved) : mockUsers;
    setUsers(data);
    setLoading(false);
  };

  const saveUsers = (data) => {
    localStorage.setItem('users', JSON.stringify(data));
    setUsers(data);
  };

  // Débloquer un utilisateur
  const handleUnblock = async (userId) => {
    await simulateDelay(200);
    const updated = users.map(u => 
      u.id === userId ? { ...u, blocked: false, blockedReason: null } : u
    );
    saveUsers(updated);
  };

  // Bloquer un utilisateur
  const handleBlock = async (userId) => {
    const reason = window.prompt('Raison du blocage:');
    if (reason) {
      await simulateDelay(200);
      const updated = users.map(u => 
        u.id === userId ? { ...u, blocked: true, blockedReason: reason } : u
      );
      saveUsers(updated);
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
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.prenom.toLowerCase().includes(searchTerm.toLowerCase());
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
              <h3>{user.prenom} {user.nom}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-date">Inscrit le {user.createdAt}</p>
              {user.blocked && user.blockedReason && (
                <div className="blocked-reason">
                  <AlertTriangle size={14} />
                  {user.blockedReason}
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
