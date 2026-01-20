import React from 'react';
import { useSignalements } from '../../context/SignalementContext';
import { 
  MapPin, 
  Ruler, 
  TrendingUp, 
  Wallet,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import './RecapTable.css';

const RecapTable = () => {
  const { recapitulatif, loading } = useSignalements();

  // Formater le budget
  const formatBudget = (budget) => {
    if (!budget) return '0 Ar';
    if (budget >= 1000000000) {
      return `${(budget / 1000000000).toFixed(2)} Mrd Ar`;
    }
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(1)} M Ar`;
    }
    return `${budget.toLocaleString()} Ar`;
  };

  if (loading || !recapitulatif) {
    return (
      <div className="recap-loading">
        Chargement des statistiques...
      </div>
    );
  }

  return (
    <div className="recap-container">
      <h2 className="recap-title">Tableau Récapitulatif</h2>
      
      <div className="recap-grid">
        {/* Nombre de points */}
        <div className="recap-card">
          <div className="recap-icon" style={{ backgroundColor: '#e0f2fe' }}>
            <MapPin size={24} color="#0284c7" />
          </div>
          <div className="recap-info">
            <span className="recap-label">Nombre de points</span>
            <span className="recap-value">{recapitulatif.nombrePoints}</span>
          </div>
        </div>

        {/* Surface totale */}
        <div className="recap-card">
          <div className="recap-icon" style={{ backgroundColor: '#f0fdf4' }}>
            <Ruler size={24} color="#16a34a" />
          </div>
          <div className="recap-info">
            <span className="recap-label">Surface totale</span>
            <span className="recap-value">{recapitulatif.totalSurface.toLocaleString()} m²</span>
          </div>
        </div>

        {/* Avancement */}
        <div className="recap-card">
          <div className="recap-icon" style={{ backgroundColor: '#fef3c7' }}>
            <TrendingUp size={24} color="#d97706" />
          </div>
          <div className="recap-info">
            <span className="recap-label">Avancement</span>
            <span className="recap-value">{recapitulatif.avancement}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${recapitulatif.avancement}%` }}
            ></div>
          </div>
        </div>

        {/* Budget total */}
        <div className="recap-card">
          <div className="recap-icon" style={{ backgroundColor: '#fae8ff' }}>
            <Wallet size={24} color="#a855f7" />
          </div>
          <div className="recap-info">
            <span className="recap-label">Budget total</span>
            <span className="recap-value">{formatBudget(recapitulatif.totalBudget)}</span>
          </div>
        </div>
      </div>

      {/* Détail par statut */}
      <div className="recap-status-grid">
        <div className="status-card nouveau">
          <AlertCircle size={20} />
          <span className="status-count">{recapitulatif.nouveaux}</span>
          <span className="status-label">Nouveaux</span>
        </div>
        <div className="status-card en-cours">
          <Clock size={20} />
          <span className="status-count">{recapitulatif.enCours}</span>
          <span className="status-label">En cours</span>
        </div>
        <div className="status-card termine">
          <CheckCircle size={20} />
          <span className="status-count">{recapitulatif.termines}</span>
          <span className="status-label">Terminés</span>
        </div>
      </div>
    </div>
  );
};

export default RecapTable;
