import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
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
import { pointsAPI } from '../../services/api';
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
function MapClickHandler({ setPopupInfo, onRightClick }) {
  useMapEvents({
    click: () => {
      setPopupInfo(null);
    },
    contextmenu: (e) => {
      e.originalEvent.preventDefault();
      if (onRightClick) {
        onRightClick(e.latlng);
      }
    },
  });
  return null;
}

const MapView = ({ onMarkerClick, onMapClick, previewCoords }) => {
  const [signalements, setSignalements] = useState([]);
  const [allSignalements, setAllSignalements] = useState([]);
  const [points, setPoints] = useState([]);
  const [allPoints, setAllPoints] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [selectedStatuts, setSelectedStatuts] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPosition, setCreatePosition] = useState(null);

  // Position initiale : Antananarivo
  const centerPosition = [-18.8792, 47.5079];
  
  // Charger les données
  useEffect(() => {
    loadData();
    loadPoints();
    loadStatuts();
  }, []);

  // Filtrer les signalements et points quand les statuts sélectionnés changent
  useEffect(() => {
    if (selectedStatuts.length === 0) {
      setSignalements(allSignalements);
      setPoints(allPoints);
    } else {
      const filteredSignalements = allSignalements.filter(s => {
        // s.statut est maintenant une string directe (NOUVEAU, EN_COURS, TERMINE)
        const statutCode = typeof s.statut === 'string' ? s.statut : s.statut?.code;
        return selectedStatuts.includes(statutCode);
      });
      setSignalements(filteredSignalements);
      
      const filteredPoints = allPoints.filter(p => {
        const statutCode = typeof p.statut === 'string' ? p.statut : p.statut?.code;
        // Mapper A_FAIRE -> NOUVEAU pour le filtrage
        const mappedCode = statutCode === 'A_FAIRE' ? 'NOUVEAU' : statutCode;
        return selectedStatuts.includes(mappedCode);
      });
      setPoints(filteredPoints);
    }
  }, [selectedStatuts, allSignalements, allPoints]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routesAPI.getRoutesEnTravaux();
      console.log('[MapView] Données reçues:', data.length, 'signalements');
      console.log('[MapView] Premier signalement:', data[0]);
      
      // Filtrer et valider les données
      const validData = data
        .map(s => {
          // Le statut est maintenant un ENUM string (NOUVEAU, EN_COURS, TERMINE)
          // au lieu d'un objet {code, description}
          const statutCode = typeof s.statut === 'string' ? s.statut : s.statut?.code;
          
          return {
            ...s,
            latitude: parseFloat(s.latitude) || 0,
            longitude: parseFloat(s.longitude) || 0,
            surfaceM2: parseFloat(s.surface_m2 ?? s.surfaceM2) || 0,
            budget: parseFloat(s.budget ?? s.budget) || 0,
            avancementPourcentage: parseInt(s.avancement_pourcentage ?? s.avancementPourcentage ?? 0, 10) || 0,
            dateDetection: s.date_detection ?? s.dateDetection ?? null,
            statut: statutCode, // Normaliser le statut en string
            probleme: s.probleme?.nom || s.nom || 'Sans nom'
          };
        })
        .filter(s => isValidCoords(s.latitude, s.longitude));
      
      console.log('[MapView] Données valides:', validData.length, 'signalements');
      setAllSignalements(validData);
      setSignalements(validData);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des signalements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPoints = async () => {
    try {
      const data = await pointsAPI.getAll();
      console.log('[MapView] Points reçus:', data.length, 'points');
      
      // Normaliser les points avec le même format que les signalements
      const validPoints = data
        .map(p => {
          // Mapper le statut du point (objet avec code) vers string
          const statutCode = p.statut?.code || 'A_FAIRE';
          
          return {
            ...p,
            latitude: parseFloat(p.latitude) || 0,
            longitude: parseFloat(p.longitude) || 0,
            surfaceM2: parseFloat(p.surface_m2) || 0,
            budget: parseFloat(p.budget) || 0,
            avancementPourcentage: parseInt(p.avancement_pourcentage ?? 0, 10) || 0,
            dateDetection: p.date_detection,
            statut: statutCode,
            nom: p.probleme?.nom || 'Point sans nom',
            description: p.probleme?.description || '',
            probleme: p.probleme?.nom || 'Sans nom',
            isPoint: true // Flag pour identifier qu'il s'agit d'un point
          };
        })
        .filter(p => isValidCoords(p.latitude, p.longitude));
      
      console.log('[MapView] Points valides:', validPoints.length);
      setAllPoints(validPoints);
      setPoints(validPoints);
    } catch (err) {
      console.error('Erreur lors du chargement des points:', err);
    }
  };

  const loadStatuts = async () => {
    try {
      const data = await routesAPI.getAllStatuts();
      setStatuts(data);
      // Mapper les codes de l'API vers les ENUM de la table signalements
      // A_FAIRE -> NOUVEAU, EN_COURS -> EN_COURS, TERMINE -> TERMINE
      const mappedCodes = data.map(s => {
        if (s.code === 'A_FAIRE') return 'NOUVEAU';
        return s.code;
      });
      setSelectedStatuts(mappedCodes);
      console.log('[MapView] Statuts chargés et mappés:', mappedCodes);
    } catch (err) {
      console.error('Erreur lors du chargement des statuts:', err);
      // En cas d'erreur, utiliser les valeurs par défaut
      setSelectedStatuts(['NOUVEAU', 'EN_COURS', 'TERMINE']);
    }
  };

  // Couleurs selon le statut
  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 'A_FAIRE':
      case 'NOUVEAU':
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
      case 'NOUVEAU':
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
    const statut = statuts.find(s => s.code === statusCode || (s.code === 'A_FAIRE' && statusCode === 'NOUVEAU'));
    if (statut) return statut.description;
    
    switch (statusCode) {
      case 'A_FAIRE':
      case 'NOUVEAU':
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
    // Mapper A_FAIRE vers NOUVEAU pour correspondre aux signalements
    const mappedCode = statutCode === 'A_FAIRE' ? 'NOUVEAU' : statutCode;
    
    if (selectedStatuts.includes(mappedCode)) {
      setSelectedStatuts(selectedStatuts.filter(s => s !== mappedCode));
    } else {
      setSelectedStatuts([...selectedStatuts, mappedCode]);
    }
  };

  const selectAllStatuts = () => {
    // Mapper A_FAIRE vers NOUVEAU
    const mappedCodes = statuts.map(s => s.code === 'A_FAIRE' ? 'NOUVEAU' : s.code);
    setSelectedStatuts(mappedCodes);
  };

  const clearAllStatuts = () => {
    setSelectedStatuts([]);
  };

  const handleMarkerClick = (signalement) => {
    setPopupInfo(signalement);
    if (onMarkerClick) {
      onMarkerClick(signalement);
    }

    // Also forward coords to onMapClick so clicking a marker can prefill create point
    if (onMapClick && signalement) {
      const lat = parseFloat(signalement.latitude ?? signalement.lat ?? signalement.latitude);
      const lng = parseFloat(signalement.longitude ?? signalement.lon ?? signalement.longitude ?? signalement.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        try { onMapClick({ lat, lng }); } catch (err) { console.error('Erreur forwarding marker coords:', err); }
      }
    }
  };

  const handleMapLoad = () => {
    setMapReady(true);
    console.log('Carte Leaflet chargée avec succès');
  };

  // Gérer le clic droit pour créer un signalement
  const handleRightClick = (latlng) => {
    setCreatePosition({ lat: latlng.lat, lng: latlng.lng });
    setShowCreateModal(true);
  };

  // Créer un nouveau signalement
  const handleCreateSignalement = async (formData) => {
    try {
      setLoading(true);
      const newSignalement = {
        nom: formData.nom || 'Nouveau signalement',
        description: formData.description || '',
        latitude: createPosition.lat,
        longitude: createPosition.lng,
        probleme_id: parseInt(formData.probleme_id) || 1,
        statut: 'NOUVEAU',
        surface_m2: parseFloat(formData.surface_m2) || 0,
        budget: parseFloat(formData.budget) || 0,
        date_detection: new Date().toISOString().split('T')[0]
      };

      // Appeler l'API pour créer le signalement
      const response = await fetch('http://localhost:3000/api/signalements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSignalement)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du signalement');
      }

      // Recharger les données
      await loadData();
      setShowCreateModal(false);
      setCreatePosition(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la création du signalement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const getStats = () => {
    // Combiner signalements et points pour les statistiques
    const allItems = [...allSignalements, ...allPoints];
    const total = allItems.length;
    const filtered = signalements.length + points.length;
    const parStatut = {};
    
    allItems.forEach(item => {
      // item.statut est une string directe (NOUVEAU, EN_COURS, TERMINE) ou A_FAIRE pour les points
      const statutCode = typeof item.statut === 'string' ? item.statut : item.statut?.code;
      // Mapper A_FAIRE -> NOUVEAU pour les statistiques
      const mappedCode = statutCode === 'A_FAIRE' ? 'NOUVEAU' : statutCode;
      if (mappedCode) {
        parStatut[mappedCode] = (parStatut[mappedCode] || 0) + 1;
      }
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
            {statuts.map(statut => {
              // Mapper A_FAIRE vers NOUVEAU pour la vérification
              const mappedCode = statut.code === 'A_FAIRE' ? 'NOUVEAU' : statut.code;
              const isSelected = selectedStatuts.includes(mappedCode);
              
              return (
                <div 
                  key={statut.id} 
                  className={`filter-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleStatutFilter(statut.code)}
                >
                  <div 
                    className="filter-dot" 
                    style={{ backgroundColor: getStatusColor(statut.code) }}
                  ></div>
                  <span className="filter-label">{statut.description}</span>
                  <span className="filter-count">({stats.parStatut[mappedCode] || 0})</span>
                </div>
              );
            })}
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
                icon={createCustomIcon(typeof signalement.statut === 'string' ? signalement.statut : signalement.statut?.code)}
                eventHandlers={{
                  click: () => handleMarkerClick(signalement),
                  mouseover: () => setHoveredMarker(signalement.id),
                  mouseout: () => setHoveredMarker(null)
                }}
              >
                {/* Tooltip au survol */}
                {hoveredMarker === signalement.id && (
                  <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    permanent={false}
                    className="marker-tooltip"
                  >
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <span 
                          className="tooltip-status"
                          style={{ backgroundColor: getStatusColor(typeof signalement.statut === 'string' ? signalement.statut : signalement.statut?.code) }}
                        >
                          {getStatusIcon(typeof signalement.statut === 'string' ? signalement.statut : signalement.statut?.code)}
                          <span>{getStatusLabel(typeof signalement.statut === 'string' ? signalement.statut : signalement.statut?.code)}</span>
                        </span>
                        <span className="tooltip-date">
                          {routesAPI.formatDate(signalement.dateDetection || signalement.date_detection)}
                        </span>
                      </div>
                      <p className="tooltip-description">{signalement.probleme?.nom || signalement.probleme || signalement.description}</p>
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
                            🏗️ {typeof signalement.entreprise === 'object' ? signalement.entreprise.nom : signalement.entreprise}
                          </span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                )}
              </Marker>
            );
          })}

          {/* Markers pour chaque point filtré */}
          {points.map((point) => {
            const [lat, lng] = parseCoords(point.latitude, point.longitude);
            const statutCode = typeof point.statut === 'string' ? point.statut : point.statut?.code;
            
            return (
              <Marker
                key={`point-${point.id}`}
                position={[lat, lng]}
                icon={createCustomIcon(statutCode)}
                eventHandlers={{
                  click: () => handleMarkerClick(point),
                  mouseover: () => setHoveredMarker(`point-${point.id}`),
                  mouseout: () => setHoveredMarker(null)
                }}
              >
                {/* Tooltip au survol */}
                {hoveredMarker === `point-${point.id}` && (
                  <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    permanent={false}
                    className="marker-tooltip"
                  >
                    <div className="tooltip-content">
                      <div className="tooltip-header">
                        <span 
                          className="tooltip-status"
                          style={{ backgroundColor: getStatusColor(statutCode) }}
                        >
                          {getStatusIcon(statutCode)}
                          <span>{getStatusLabel(statutCode)}</span>
                        </span>
                        <span className="tooltip-date">
                          {routesAPI.formatDate(point.dateDetection || point.date_detection)}
                        </span>
                      </div>
                      <p className="tooltip-description">{point.nom || point.probleme}</p>
                      <p className="tooltip-address">
                        {formatCoordonnees(lat, lng)}
                      </p>
                      <div className="tooltip-details">
                        <span>Surface: {point.surfaceM2 || point.surface_m2 || 'N/A'} m²</span>
                        <span>Budget: {formatBudget(point.budget)}</span>
                      </div>
                      <div className="tooltip-details">
                        <span>Avancement: {point.avancementPourcentage || point.avancement_pourcentage || 0}%</span>
                        {point.entreprise && (
                          <span className="tooltip-entreprise">
                            🏗️ {typeof point.entreprise === 'object' ? point.entreprise.nom : point.entreprise}
                          </span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
                )}
              </Marker>
            );
          })}

          {/* Marqueur de prévisualisation si on crée un point */}
          {previewCoords && isValidCoords(previewCoords.lat, previewCoords.lng) && (
            <Marker
              position={[parseFloat(previewCoords.lat), parseFloat(previewCoords.lng)]}
              icon={L.divIcon({
                html: '<div class="preview-marker"></div>',
                className: 'preview-marker-icon',
                iconSize: [20, 20],
                iconAnchor: [10, 20]
              })}
            />
          )}

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
                      style={{ backgroundColor: getStatusColor(typeof popupInfo.statut === 'string' ? popupInfo.statut : popupInfo.statut?.code) }}
                    >
                      {getStatusIcon(typeof popupInfo.statut === 'string' ? popupInfo.statut : popupInfo.statut?.code)}
                      {getStatusLabel(typeof popupInfo.statut === 'string' ? popupInfo.statut : popupInfo.statut?.code)}
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
                      <span className="value">{typeof popupInfo.entreprise === 'object' ? popupInfo.entreprise.nom : (popupInfo.entreprise || 'Non assignée')}</span>
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

          <MapClickHandler 
            setPopupInfo={setPopupInfo} 
            onMapClick={onMapClick}
            onRightClick={handleRightClick}
          />
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

      {/* Modal de création de signalement */}
      {showCreateModal && createPosition && (
        <div className="create-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h3>Nouveau Signalement</h3>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleCreateSignalement({
                nom: formData.get('nom'),
                description: formData.get('description'),
                probleme_id: formData.get('probleme_id'),
                surface_m2: formData.get('surface_m2'),
                budget: formData.get('budget')
              });
            }}>
              <div className="form-group">
                <label>Position</label>
                <input 
                  type="text" 
                  value={`${createPosition.lat.toFixed(6)}, ${createPosition.lng.toFixed(6)}`}
                  readOnly
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Nom du signalement *</label>
                <input 
                  type="text" 
                  name="nom"
                  placeholder="Ex: Nid-de-poule"
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description"
                  placeholder="Description détaillée..."
                  rows="3"
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Type de problème *</label>
                <select name="probleme_id" required className="form-control">
                  <option value="1">Nid-de-poule</option>
                  <option value="2">Éclairage défectueux</option>
                  <option value="3">Signalisation endommagée</option>
                  <option value="4">Déchet encombrant</option>
                  <option value="5">Végétation invasive</option>
                  <option value="6">Fuite eau</option>
                  <option value="7">Caniveau bouché</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Surface (m²)</label>
                  <input 
                    type="number" 
                    name="surface_m2"
                    step="0.01"
                    placeholder="0"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Budget estimé (Ar)</label>
                  <input 
                    type="number" 
                    name="budget"
                    step="0.01"
                    placeholder="0"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
                  Annuler
                </button>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le signalement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
