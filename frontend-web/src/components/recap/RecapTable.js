import React, { useEffect } from 'react';
import { useRoutes } from '../../context/RoutesContext';
import { 
  MapPin, 
  Ruler, 
  TrendingUp, 
  Wallet,
  AlertCircle,
  Clock,
  CheckCircle,
  Building,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import './RecapTable.css';

const RecapTable = () => {
  const { 
    recapitulatif, 
    loading, 
    error, 
    loadRecapitulatif,
    formatBudget,
    formatDate 
  } = useRoutes();

  // Recharger les données périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      loadRecapitulatif();
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, [loadRecapitulatif]);

  if (loading && !recapitulatif) {
    return (
      <div className="recap-loading">
        <RefreshCw className="animate-spin" size={24} />
        <span>Chargement des statistiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recap-error">
        <AlertTriangle size={24} />
        <span>Erreur: {error}</span>
        <button 
          onClick={loadRecapitulatif}
          className="retry-button"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!recapitulatif) {
    return (
      <div className="recap-empty">
        <AlertCircle size={24} />
        <span>Aucune donnée disponible</span>
      </div>
    );
  }

  // Calculer les statuts pour l'affichage
  const statutNouveau = recapitulatif.parStatut.find(s => s.code === 'A_FAIRE') || { nombrePoints: 0 };
  const statutEnCours = recapitulatif.parStatut.find(s => s.code === 'EN_COURS') || { nombrePoints: 0 };
  const statutTermine = recapitulatif.parStatut.find(s => s.code === 'TERMINE') || { nombrePoints: 0 };

  return (
    <div className="recap-container">
      <div className="recap-header">
        <h2 className="recap-title">
          Tableau Récapitulatif des Points Routiers
        </h2>
        <button 
          onClick={loadRecapitulatif}
          className="refresh-button"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="recap-grid">
        {/* Nombre total de points */}
        <div className="recap-card primary">
          <div className="recap-icon">
            <MapPin size={24} />
          </div>
          <div className="recap-info">
            <span className="recap-label">Points totaux</span>
            <span className="recap-value">
              {recapitulatif.nombrePoints.toLocaleString()}
            </span>
            <span className="recap-subtext">
              {recapitulatif.pointsEnCours} en cours • {recapitulatif.pointsTermines} terminés
            </span>
          </div>
        </div>

        {/* Surface totale */}
        <div className="recap-card success">
          <div className="recap-icon">
            <Ruler size={24} />
          </div>
          <div className="recap-info">
            <span className="recap-label">Surface totale</span>
            <span className="recap-value">
              {recapitulatif.totalSurface.toLocaleString()} m²
            </span>
            <span className="recap-subtext">
              Moyenne: {(recapitulatif.totalSurface / recapitulatif.nombrePoints || 0).toFixed(1)} m²/point
            </span>
          </div>
        </div>

        {/* Avancement global */}
        <div className="recap-card warning">
          <div className="recap-icon">
            <TrendingUp size={24} />
          </div>
          <div className="recap-info">
            <span className="recap-label">Avancement global</span>
            <span className="recap-value">
              {recapitulatif.avancement.toFixed(1)}%
            </span>
            <div className="progress-container">
              <div 
                className="progress-bar"
                style={{ width: `${recapitulatif.avancement}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Budget total */}
        <div className="recap-card info">
          <div className="recap-icon">
            <Wallet size={24} />
          </div>
          <div className="recap-info">
            <span className="recap-label">Budget total</span>
            <span className="recap-value">
              {formatBudget(recapitulatif.totalBudget)}
            </span>
            <span className="recap-subtext">
              {recapitulatif.pointsSansBudget > 0 && 
                `${recapitulatif.pointsSansBudget} sans budget`}
            </span>
          </div>
        </div>
      </div>

      {/* Détail par statut */}
      <div className="recap-status-section">
        <h3 className="section-title">Répartition par statut</h3>
        <div className="recap-status-grid">
          <div className="status-card nouveau">
            <div className="status-icon">
              <AlertCircle size={20} />
            </div>
            <div className="status-info">
              <span className="status-count">{statutNouveau.nombrePoints}</span>
              <span className="status-label">À traiter</span>
            </div>
          </div>
          <div className="status-card en-cours">
            <div className="status-icon">
              <Clock size={20} />
            </div>
            <div className="status-info">
              <span className="status-count">{statutEnCours.nombrePoints}</span>
              <span className="status-label">En cours</span>
            </div>
          </div>
          <div className="status-card termine">
            <div className="status-icon">
              <CheckCircle size={20} />
            </div>
            <div className="status-info">
              <span className="status-count">{statutTermine.nombrePoints}</span>
              <span className="status-label">Terminés</span>
            </div>
          </div>
          <div className="status-card taux">
            <div className="status-icon">
              <Building size={20} />
            </div>
            <div className="status-info">
              <span className="status-count">{recapitulatif.tauxCompletion}%</span>
              <span className="status-label">Taux de complétion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Points récents */}
      {recapitulatif.pointsRecents && recapitulatif.pointsRecents.length > 0 && (
        <div className="recent-points-section">
          <h3 className="section-title">Points récemment détectés</h3>
          <div className="recent-points-grid">
            {recapitulatif.pointsRecents.slice(0, 5).map(point => (
              <div key={point.id} className="recent-point-card">
                <div className="point-header">
                  <span className="point-probleme">{point.probleme}</span>
                  <span className={`point-statut ${point.statut?.toLowerCase()}`}>
                    {point.statut}
                  </span>
                </div>
                <div className="point-details">
                  <div className="point-info">
                    <span className="point-label">Détecté le</span>
                    <span className="point-value">{formatDate(point.dateDetection)}</span>
                  </div>
                  <div className="point-info">
                    <span className="point-label">Surface</span>
                    <span className="point-value">
                      {point.surfaceM2 ? `${point.surfaceM2} m²` : 'Non définie'}
                    </span>
                  </div>
                  <div className="point-info">
                    <span className="point-label">Avancement</span>
                    <span className="point-value">{point.avancementPourcentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecapTable;