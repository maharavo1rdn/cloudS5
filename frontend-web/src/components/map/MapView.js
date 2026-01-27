import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import routesAPI from '../../services/routesAPI';
import './MapView.css';

// Corriger les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Fonctions utilitaires pour valider et formater les données
const formatCoordonnees = (lat, lng, precision = 4) => {
  const latNum = typeof lat === 'number' ? lat : parseFloat(lat || 0);
  const lngNum = typeof lng === 'number' ? lng : parseFloat(lng || 0);
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    return 'Coordonnées non disponibles';
  }
  
  return `${latNum.toFixed(precision)}, ${lngNum.toFixed(precision)}`;
};

const isValidCoords = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) && 
         latNum >= -90 && latNum <= 90 && 
         lngNum >= -180 && lngNum <= 180;
};

const parseCoords = (lat, lng) => {
  const latNum = parseFloat(lat || 0);
  const lngNum = parseFloat(lng || 0);
  return [isNaN(latNum) ? 0 : latNum, isNaN(lngNum) ? 0 : lngNum];
};

// Composant pour détecter les clics sur la carte
function MapClickHandler({ setPopupInfo }) {
  useMapEvents({
    click: () => {
      setPopupInfo(null);
    },
  });
  return null;
}

const MapView = ({ onMarkerClick }) => {
  const [signalements, setSignalements] = useState([]);
  const [allSignalements, setAllSignalements] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [selectedStatuts, setSelectedStatuts] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  // Position initiale : Antananarivo
  const centerPosition = [-18.8792, 47.5079];
  
  // Charger les données
  useEffect(() => {
    loadData();
    loadStatuts();
  }, []);

  // Filtrer les signalements quand les statuts sélectionnés changent
  useEffect(() => {
    if (selectedStatuts.length === 0) {
      setSignalements(allSignalements);
    } else {
      const filtered = allSignalements.filter(s => 
        selectedStatuts.includes(s.statut?.code || s.statut)
      );
      setSignalements(filtered);
    }
  }, [selectedStatuts, allSignalements]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesAPI.getRoutesEnTravaux();
      // Filtrer et valider les données
      const validData = data
        .map(s => ({
          ...s,
          latitude: parseFloat(s.latitude) || 0,
          longitude: parseFloat(s.longitude) || 0,
          surfaceM2: parseFloat(s.surfaceM2) || 0,
          budget: parseFloat(s.budget) || 0,
          avancementPourcentage: parseInt(s.avancementPourcentage) || 0
        }))
        .filter(s => isValidCoords(s.latitude, s.longitude));
      
      setAllSignalements(validData);
      setSignalements(validData);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des signalements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatuts = async () => {
    try {
      const data = await routesAPI.getAllStatuts();
      setStatuts(data);
      setSelectedStatuts(data.map(s => s.code));
    } catch (err) {
      console.error('Erreur lors du chargement des statuts:', err);
    }
  };

  // Couleurs selon le statut
  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 'A_FAIRE':
      case 'nouveau':
        return '#ef4444';
      case 'EN_COURS':
      case 'en_cours':
        return '#f59e0b';
      case 'TERMINE':
      case 'termine':
        return '#22c55e';
      default:
        return '#64748b';
    }
  };

  // Icône personnalisée pour Leaflet
  const createCustomIcon = (statusCode) => {
    const color = getStatusColor(statusCode);
    return L.divIcon({
      html: `
        <div class="marker-pin" style="background-color: ${color};">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      className: 'custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36]
    });
  };

  // Icône selon le statut
  const getStatusIcon = (statusCode) => {
    switch (statusCode) {
      case 'A_FAIRE':
      case 'nouveau':
        return <AlertCircle size={16} />;
      case 'EN_COURS':
      case 'en_cours':
        return <Clock size={16} />;
      case 'TERMINE':
      case 'termine':
        return <CheckCircle size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  // Label du statut
  const getStatusLabel = (statusCode) => {
    const statut = statuts.find(s => s.code === statusCode);
    if (statut) return statut.description;
    
    switch (statusCode) {
      case 'A_FAIRE':
      case 'nouveau':
        return 'Nouveau';
      case 'EN_COURS':
      case 'en_cours':
        return 'En cours';
      case 'TERMINE':
      case 'termine':
        return 'Terminé';
      default:
        return statusCode || 'Non défini';
    }
  };

  // Formater le budget
  const formatBudget = (budget) => {
    if (!budget) return 'N/A';
    return routesAPI.formatBudget(budget);
  };

  // Gestion des filtres
  const toggleStatutFilter = (statutCode) => {
    if (selectedStatuts.includes(statutCode)) {
      setSelectedStatuts(selectedStatuts.filter(s => s !== statutCode));
    } else {
      setSelectedStatuts([...selectedStatuts, statutCode]);
    }
  };

  const selectAllStatuts = () => {
    setSelectedStatuts(statuts.map(s => s.code));
  };

  const clearAllStatuts = () => {
    setSelectedStatuts([]);
  };

  const handleMarkerClick = (signalement) => {
    setPopupInfo(signalement);
    if (onMarkerClick) {
      onMarkerClick(signalement);
    }
  };

  const handleMapLoad = () => {
    setMapReady(true);
    console.log('Carte Leaflet chargée avec succès');
  };

  // Statistiques
  const getStats = () => {
    const total = allSignalements.length;
    const filtered = signalements.length;
    const parStatut = {};
    
    allSignalements.forEach(s => {
      const statutCode = s.statut?.code || s.statut;
      parStatut[statutCode] = (parStatut[statutCode] || 0) + 1;
    });

    return { total, filtered, parStatut };
  };

  const stats = getStats();

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">
          <AlertTriangle size={24} />
          <p>{error}</p>
          <button onClick={loadData} className="retry-button">
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {/* En-tête avec filtres */}
      <div className="map-header">
        <div className="map-title-section">
          <h2 className="map-title">Carte des Points Routiers</h2>
          <div className="map-stats">
            <span className="stat-item">
              Total: <strong>{stats.total}</strong> points
            </span>
            <span className="stat-item">
              Affichés: <strong>{stats.filtered}</strong> points
            </span>
          </div>
        </div>
        
        <div className="map-controls">
          <button 
            onClick={() => setShowFilter(!showFilter)} 
            className={`filter-toggle ${showFilter ? 'active' : ''}`}
          >
            <Filter size={18} />
            <span>Filtrer ({selectedStatuts.length}/{statuts.length})</span>
          </button>
          
          <button onClick={loadData} className="refresh-button" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilter && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Filtrer par statut</h3>
            <button onClick={() => setShowFilter(false)} className="close-filter">
              <X size={18} />
            </button>
          </div>
          
          <div className="filter-actions">
            <button onClick={selectAllStatuts} className="filter-action-btn">
              Tout sélectionner
            </button>
            <button onClick={clearAllStatuts} className="filter-action-btn">
              Tout désélectionner
            </button>
          </div>
          
          <div className="filter-options">
            {statuts.map(statut => (
              <div 
                key={statut.id} 
                className={`filter-option ${selectedStatuts.includes(statut.code) ? 'selected' : ''}`}
                onClick={() => toggleStatutFilter(statut.code)}
              >
                <div 
                  className="filter-dot" 
                  style={{ backgroundColor: getStatusColor(statut.code) }}
                ></div>
                <span className="filter-label">{statut.description}</span>
                <span className="filter-count">({stats.parStatut[statut.code] || 0})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carte */}
      <div className="map-wrapper">
        <MapContainer
          center={centerPosition}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          whenReady={handleMapLoad}
          scrollWheelZoom={true}
        >
          {/* TileLayer OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* TileLayer Tileserver local (commenté) */}
          {/* <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors - Local tileserver'
            url="http://localhost:8088/styles/basic-preview/{z}/{x}/{y}.png"
          /> */}
          
          {/* Markers pour chaque signalement filtré */}
          {signalements.map((signalement) => {
            const [lat, lng] = parseCoords(signalement.latitude, signalement.longitude);
            
            return (
              <Marker
                key={signalement.id}
                position={[lat, lng]}
                icon={createCustomIcon(signalement.statut?.code || signalement.statut)}
                eventHandlers={{
                  click: () => handleMarkerClick(signalement),
                  mouseover: () => setHoveredMarker(signalement.id),
                  mouseout: () => setHoveredMarker(null)
                }}
              >
                {/* Tooltip au survol */}
                {hoveredMarker === signalement.id && (
                  <Popup
                    position={[lat, lng]}
                    closeButton={false}
                    className="marker-tooltip"
                  >
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <span 
                          className="tooltip-status"
                          style={{ backgroundColor: getStatusColor(signalement.statut?.code || signalement.statut) }}
                        >
                          {getStatusIcon(signalement.statut?.code || signalement.statut)}
                          <span>{getStatusLabel(signalement.statut?.code || signalement.statut)}</span>
                        </span>
                        <span className="tooltip-date">
                          {routesAPI.formatDate(signalement.dateDetection)}
                        </span>
                      </div>
                      <p className="tooltip-description">{signalement.probleme || signalement.description}</p>
                      <p className="tooltip-address">
                        {formatCoordonnees(lat, lng)}
                      </p>
                      <div className="tooltip-details">
                        <span>Surface: {signalement.surfaceM2 || 'N/A'} m²</span>
                        <span>Budget: {formatBudget(signalement.budget)}</span>
                      </div>
                      <div className="tooltip-details">
                        <span>Avancement: {signalement.avancementPourcentage || 0}%</span>
                        {signalement.entreprise && (
                          <span className="tooltip-entreprise">
                            🏗️ {signalement.entreprise}
                          </span>
                        )}
                      </div>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {/* Popup détaillé au clic */}
          {popupInfo && (() => {
            const [lat, lng] = parseCoords(popupInfo.latitude, popupInfo.longitude);
            
            return (
              <Popup
                position={[lat, lng]}
                onClose={() => setPopupInfo(null)}
                className="custom-popup"
              >
                <div className="popup-content">
                  <div className="popup-header">
                    <span 
                      className="popup-status"
                      style={{ backgroundColor: getStatusColor(popupInfo.statut?.code || popupInfo.statut) }}
                    >
                      {getStatusIcon(popupInfo.statut?.code || popupInfo.statut)}
                      {getStatusLabel(popupInfo.statut?.code || popupInfo.statut)}
                    </span>
                  </div>
                  <h3>{popupInfo.probleme || popupInfo.description}</h3>
                  <p className="popup-address">
                    Coordonnées: {formatCoordonnees(lat, lng, 6)}
                  </p>
                  <div className="popup-info-grid">
                    <div className="popup-info-item">
                      <span className="label">Détecté le</span>
                      <span className="value">{routesAPI.formatDate(popupInfo.dateDetection)}</span>
                    </div>
                    <div className="popup-info-item">
                      <span className="label">Surface</span>
                      <span className="value">{popupInfo.surfaceM2 || 'N/A'} m²</span>
                    </div>
                    <div className="popup-info-item">
                      <span className="label">Budget</span>
                      <span className="value">{formatBudget(popupInfo.budget)}</span>
                    </div>
                    <div className="popup-info-item">
                      <span className="label">Avancement</span>
                      <span className="value">{popupInfo.avancementPourcentage || 0}%</span>
                    </div>
                    <div className="popup-info-item full-width">
                      <span className="label">Entreprise</span>
                      <span className="value">{popupInfo.entreprise || popupInfo.entreprise?.nom || 'Non assignée'}</span>
                    </div>
                    {popupInfo.dateDebut && (
                      <div className="popup-info-item">
                        <span className="label">Début travaux</span>
                        <span className="value">{routesAPI.formatDate(popupInfo.dateDebut)}</span>
                      </div>
                    )}
                    {popupInfo.dateFin && (
                      <div className="popup-info-item">
                        <span className="label">Fin travaux</span>
                        <span className="value">{routesAPI.formatDate(popupInfo.dateFin)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            );
          })()}

          <MapClickHandler setPopupInfo={setPopupInfo} />
        </MapContainer>

        {/* Légende */}
        <div className="map-legend">
          <h4>Légende</h4>
          {statuts.map(statut => (
            <div key={statut.id} className="legend-item">
              <span 
                className="legend-dot" 
                style={{ backgroundColor: getStatusColor(statut.code) }}
              ></span>
              <span className="legend-label">{statut.description}</span>
              <span className="legend-count">({stats.parStatut[statut.code] || 0})</span>
            </div>
          ))}
        </div>

        {/* Indicateur de chargement */}
        {(loading || !mapReady) && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <span>Chargement de la carte...</span>
          </div>
        )}
      </div>

      {/* Barre d'information */}
      <div className="map-info-bar">
        <div className="info-item">
          <span className="info-label">Points affichés:</span>
          <span className="info-value">{stats.filtered} / {stats.total}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Statuts actifs:</span>
          <span className="info-value">{selectedStatuts.length} / {statuts.length}</span>
        </div>
        <button 
          onClick={() => setShowFilter(!showFilter)} 
          className="filter-info-btn"
        >
          <Filter size={16} />
          {showFilter ? 'Masquer filtres' : 'Afficher filtres'}
        </button>
      </div>
    </div>
  );
};

export default MapView;