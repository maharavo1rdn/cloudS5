import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader,
  BarChart3
} from 'lucide-react';
import './ProcessingTimeStats.css';

const ProcessingTimeStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProcessingTimeStats();
  }, []);

  const fetchProcessingTimeStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/stats/processing-times', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="processing-stats-container">
        <div className="loading-state">
          <Loader size={32} className="loading-icon" />
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="processing-stats-container">
        <div className="error-state">
          <AlertCircle size={32} />
          <p>Erreur: {error}</p>
          <button onClick={fetchProcessingTimeStats} className="btn-retry">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="processing-stats-container">
      <div className="stats-header">
        <div className="header-title">
          <BarChart3 size={24} />
          <h2>Statistiques de Délai de Traitement</h2>
        </div>
        <button onClick={fetchProcessingTimeStats} className="btn-refresh">
          Actualiser
        </button>
      </div>

      {/* Cartes principales */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Délai Moyen Global</h3>
            <p className="stat-value">{stats.averageProcessingDays}</p>
            <p className="stat-unit">jours</p>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Terminés</h3>
            <p className="stat-value">{stats.totalTermines}</p>
            <p className="stat-unit">
              {stats.averageProcessingDaysTermines} jours en moyenne
            </p>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-label">En Cours</h3>
            <p className="stat-value">{stats.totalEnCours}</p>
            <p className="stat-unit">
              {stats.averageProcessingDaysEnCours} jours depuis le début
            </p>
          </div>
        </div>
      </div>

      {/* Tableaux par problème et entreprise */}
      <div className="stats-tables">
        <div className="table-section">
          <h3 className="table-title">
            <TrendingUp size={18} />
            Délai Moyen par Type de Problème
          </h3>
          <div className="table-wrapper">
            {stats.parProbleme && stats.parProbleme.length > 0 ? (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Type de Problème</th>
                    <th className="center">Nombre</th>
                    <th className="center">Délai Moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.parProbleme.map((item, index) => (
                    <tr key={index}>
                      <td className="problem-name">{item.probleme}</td>
                      <td className="center">{item.count}</td>
                      <td className="center duration">
                        <span className="duration-badge">
                          {item.averageDays}j
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Aucune donnée disponible</p>
            )}
          </div>
        </div>

        <div className="table-section">
          <h3 className="table-title">
            <TrendingUp size={18} />
            Délai Moyen par Entreprise
          </h3>
          <div className="table-wrapper">
            {stats.parEntreprise && stats.parEntreprise.length > 0 ? (
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Entreprise</th>
                    <th className="center">Nombre</th>
                    <th className="center">Délai Moyen</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.parEntreprise.map((item, index) => (
                    <tr key={index}>
                      <td className="company-name">{item.entreprise}</td>
                      <td className="center">{item.count}</td>
                      <td className="center duration">
                        <span className="duration-badge">
                          {item.averageDays}j
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">Aucune données disponible</p>
            )}
          </div>
        </div>
      </div>

      {/* Info footer */}
      <div className="stats-footer">
        <p>
          <span className="info-icon">ℹ️</span>
          Les délais sont calculés en jours à partir de la date de début. 
          Pour les travaux terminés, c'est le temps entre date de début et date de fin.
          Pour les travaux en cours, c'est le temps depuis la date de début jusqu'à aujourd'hui.
        </p>
      </div>
    </div>
  );
};

export default ProcessingTimeStats;
