import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Navigation, 
  LogIn, 
  LogOut, 
  User, 
  Settings,
  Menu,
  X,
  RefreshCw
} from 'lucide-react';
import SyncModal from '../../components/SyncModal';
import './Header.css';

const Header = () => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [showSyncModal, setShowSyncModal] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo et titre */}
        <Link to="/" className="header-brand">
          <div className="header-logo">
            <Navigation size={24} color="white" strokeWidth={2.5} />
          </div>
          <div className="header-title">
            <h1>Travaux Routiers Tana</h1>
            <p>Suivi des travaux d'Antananarivo</p>
          </div>
        </Link>

        {/* Navigation Desktop */}
        <nav className="header-nav desktop-nav">
          <Link to="/" className="nav-link">Accueil</Link>
          
          {user && isManager() && (
            <>
              <Link to="/manager/signalements" className="nav-link">Gestion Signalements</Link>
              <Link to="/manager/users" className="nav-link">Utilisateurs</Link>
            </>
          )}
        </nav>

        {/* Actions utilisateur */}
        <div className="header-actions desktop-nav">
            <button className="btn-sync" onClick={() => setShowSyncModal(true)} title="Synchroniser avec Firebase">
              <RefreshCw size={16} />
              Synchroniser
            </button>

          {user ? (
            <div className="user-menu">
              <div className="user-info">
                <User size={18} />
                <span>{user.prenom} {user.nom}</span>
                {isManager() && <span className="badge-manager">Manager</span>}
              </div>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={18} />
                Déconnexion
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              <LogIn size={18} />
              Connexion
            </Link>
          )}
        </div>

        {/* Menu burger mobile */}
        <button 
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Accueil
          </Link>

          {user && isManager() && (
            <>
              <Link to="/manager/signalements" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Gestion Signalements
              </Link>
              <Link to="/manager/users" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                Utilisateurs
              </Link>
            </>
          )}

          <button className="mobile-nav-link" onClick={() => { setMenuOpen(false); setShowSyncModal(true); }}>
            <RefreshCw size={16} />
            Synchroniser
          </button>

          <div className="mobile-divider"></div>

          {user ? (
            <>
              <div className="mobile-user-info">
                <User size={18} />
                <span>{user.prenom} {user.nom}</span>
                {isManager() && <span className="badge-manager">Manager</span>}
              </div>
              <button onClick={handleLogout} className="mobile-nav-link logout">
                <LogOut size={18} />
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <LogIn size={18} />
              Connexion
            </Link>
          )}
        </div>
      )}

      {showSyncModal && (
        <SyncModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
      )}
    </header>
  );
};

export default Header;
