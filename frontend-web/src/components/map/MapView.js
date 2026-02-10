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
import { pointsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PhotoGalleryModal from '../gallery/PhotoGalleryModal';
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
  const { isManager } = useAuth();
  const [points, setPoints] = useState([]);
  const [allPoints, setAllPoints] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [selectedStatuts, setSelectedStatuts] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPosition, setCreatePosition] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  const openGalleryForPoint = async (pointId) => {
    try {
      setGalleryImages([]);
      setLoading(true);
      const data = await routesAPI.getPointById(pointId);
      const imgs = (data.images || []).map(i => ({ id: i.id, image_url: i.image_url, firebase_url: i.firebase_url, created_at: i.created_at }));
      if (!imgs.length) {
        alert('Aucune photo disponible pour ce point.');
        return;
      }
      setGalleryImages(imgs);
      setShowGallery(true);
    } catch (err) {
      console.error('Erreur récupération images:', err);
      alert('Erreur lors du chargement des photos');
    } finally {
      setLoading(false);
    }
  };

  const closeGallery = () => {
    setShowGallery(false);
    setGalleryImages([]);
  };

  // Position initiale : Antananarivo
  const centerPosition = [-18.8792, 47.5079];
  
  // Charger les données
  useEffect(() => {
    loadPoints();
    loadStatuts();
  }, []);

  // Filtrer les points quand les statuts sélectionnés changent
  useEffect(() => {
    if (selectedStatuts.length === 0) {
      setPoints(allPoints);
    } else {
      const filteredPoints = allPoints.filter(p => {
        const statutCode = typeof p.statut === 'string' ? p.statut : p.statut?.code;
        return selectedStatuts.includes(statutCode);
      });
      setPoints(filteredPoints);
    }
  }, [selectedStatuts, allPoints]);

  const loadPoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pointsAPI.getAll();
      console.log('[MapView] Points reçus:', data.length, 'points');
      console.log('[MapView] Premier point:', data[0]);
      
      // Normaliser les points
      const validPoints = data
        .map(p => {
          // Mapper le statut du point (objet avec code) vers string
          // L'API retourne p.statut (alias Sequelize) et non p.point_statut
          let statutCode = 'NOUVEAU'; // Par défaut
          if (p.statut && p.statut.code) {
            statutCode = p.statut.code;
          } else if (p.point_statut_id) {
            // Si on a juste l'ID, essayer de le mapper
            // 1=NOUVEAU, 2=EN_COURS, 3=TERMINE (à ajuster selon votre BDD)
            const statutMap = { 1: 'NOUVEAU', 2: 'EN_COURS', 3: 'TERMINE' };
            statutCode = statutMap[p.point_statut_id] || 'NOUVEAU';
          }
          
          return {
            ...p,
            latitude: parseFloat(p.latitude) || 0,
            longitude: parseFloat(p.longitude) || 0,
            surfaceM2: parseFloat(p.surface_m2) || 0,
            budget: parseFloat(p.budget) || 0,
            avancementPourcentage: parseInt(p.avancement_pourcentage ?? 0, 10) || 0,
            dateDetection: p.date_detection,
            statut: statutCode,
            nom: p.nom || p.probleme?.nom || 'Point sans nom',
            description: p.description || p.probleme?.description || '',
            probleme: p.probleme?.nom || 'Sans nom',
            entreprise: p.entreprise || null  // Préserver l'objet entreprise
          };
        })
        .filter(p => isValidCoords(p.latitude, p.longitude));
      
      console.log('[MapView] Points valides:', validPoints.length);
      setAllPoints(validPoints);
      setPoints(validPoints);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors du chargement des points:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatuts = async () => {
    try {
      const data = await routesAPI.getAllStatuts();
      setStatuts(data);
      const codes = data.map(s => s.code);
      setSelectedStatuts(codes);
      console.log('[MapView] Statuts chargés:', codes);
    } catch (err) {
      console.error('Erreur lors du chargement des statuts:', err);
      // En cas d'erreur, utiliser les valeurs par défaut
      setSelectedStatuts(['A_FAIRE', 'EN_COURS', 'TERMINE']);
    }
  };

  // Couleurs selon le statut
  const getStatusColor = (statusCode) => {
    switch (statusCode) {
      case 'A_FAIRE':
        return '#ef4444';
      case 'EN_COURS':
        return '#f59e0b';
      case 'TERMINE':
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
        return <AlertCircle size={16} />;
      case 'EN_COURS':
        return <Clock size={16} />;
      case 'TERMINE':
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
        return 'À faire';
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINE':
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
    const codes = statuts.map(s => s.code);
    setSelectedStatuts(codes);
  };

  const clearAllStatuts = () => {
    setSelectedStatuts([]);
  };

  const handleMarkerClick = (point) => {
    setPopupInfo(point);
    if (onMarkerClick) {
      onMarkerClick(point);
    }

    // Also forward coords to onMapClick so clicking a marker can prefill create point
    if (onMapClick && point) {
      const lat = parseFloat(point.latitude ?? point.lat ?? point.latitude);
      const lng = parseFloat(point.longitude ?? point.lon ?? point.longitude ?? point.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        try { onMapClick({ lat, lng }); } catch (err) { console.error('Erreur forwarding marker coords:', err); }
      }
    }
  };

  const handleMapLoad = () => {
    setMapReady(true);
    console.log('Carte Leaflet chargée avec succès');
  };

  // Gérer le clic droit pour créer un point
  const handleRightClick = (latlng) => {
    setCreatePosition({ lat: latlng.lat, lng: latlng.lng });
    setShowCreateModal(true);
  };

  // Créer un nouveau point
  const handleCreatePoint = async (formData) => {
    try {
      setLoading(true);
      const newPoint = {
        nom: formData.nom || 'Nouveau point',
        description: formData.description || '',
        latitude: createPosition.lat,
        longitude: createPosition.lng,
        probleme_id: parseInt(formData.probleme_id) || 1,
        point_statut_code: 'A_FAIRE',
        surface_m2: parseFloat(formData.surface_m2) || 0,
        niveau: formData.niveau ? parseInt(formData.niveau) : null,
        date_detection: new Date().toISOString().split('T')[0]
      };

      // Appeler l'API pour créer le point
      const response = await fetch('http://localhost:3000/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newPoint)
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création du point');
      }

      // Recharger les données
      await loadPoints();
      setShowCreateModal(false);
      setCreatePosition(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la création du point: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const getStats = () => {
    // Utiliser tous les points pour les statistiques
    const allItems = allPoints;
    const total = allItems.length;
    const filtered = points.length;
    const parStatut = {};
    
    allItems.forEach(item => {
      const statutCode = typeof item.statut === 'string' ? item.statut : item.statut?.code;
      if (statutCode) {
        parStatut[statutCode] = (parStatut[statutCode] || 0) + 1;
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
          <button onClick={loadPoints} className="retry-button">
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
          
          <button onClick={loadPoints} className="refresh-button" disabled={loading}>
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
              const isSelected = selectedStatuts.includes(statut.code);
              
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
                  <span className="filter-count">({stats.parStatut[statut.code] || 0})</span>
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
          
          {/* Markers pour chaque point filtré */}
          {points.map((point) => {
            const [lat, lng] = parseCoords(point.latitude, point.longitude);
            const statutCode = typeof point.statut === 'string' ? point.statut : point.statut?.code;
            return (
              <Marker
                key={point.id}
                position={[lat, lng]}
                icon={createCustomIcon(statutCode)}
                eventHandlers={{
                  mouseover: () => handleMarkerClick(point),
                  mouseout: () => setPopupInfo(null)
                }}
              >
                {/* Tooltip au survol */}
                <Tooltip
                  direction="top"
                  offset={[0, -20]}
                  permanent={hoveredMarker === point.id}
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
                        <span>Niveau: {point.niveau ? `${point.niveau}/10` : 'Non défini'}</span>
                        <span>Avancement: {point.avancementPourcentage || point.avancement_pourcentage || 0}%</span>
                      </div>
                      <div className="tooltip-details">
                        {point.entreprise && (
                          <span className="tooltip-entreprise">
                            🏗️ {point.entreprise?.nom || point.entreprise}
                          </span>
                        )}
                      </div>
                    </div>
                  </Tooltip>
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
          {popupInfo && (
            <>
              <Popup
                position={[parseFloat(popupInfo.latitude || 0), parseFloat(popupInfo.longitude || 0)]}
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
                    Coordonnées: {formatCoordonnees(popupInfo.latitude, popupInfo.longitude, 6)}
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
                      <span className="label">Niveau</span>
                      <span className="value">{popupInfo.niveau}</span>
                    </div>
                    <div className="popup-info-item">
                      <span className="label">Avancement</span>
                      <span className="value">{popupInfo.avancementPourcentage || 0}%</span>
                    </div>
                    <div className="popup-info-item full-width">
                      <span className="label">Entreprise</span>
                      <span className="value">{popupInfo.entreprise?.nom || 'Non assignée'}</span>
                    </div>

                    {/* Lien pour voir les photos */}
                    <div className="popup-info-item full-width">
                      <button className="btn-view-photos" onClick={() => openGalleryForPoint(popupInfo.id)}>
                        Voir les photos
                      </button>
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

              <PhotoGalleryModal isOpen={showGallery} images={galleryImages} initialIndex={0} onClose={closeGallery} />
            </>
          )}

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
              handleCreatePoint({
                nom: formData.get('nom'),
                description: formData.get('description'),
                probleme_id: formData.get('probleme_id'),
                surface_m2: formData.get('surface_m2'),
                niveau: formData.get('niveau')
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
                {isManager() && (
                  <div className="form-group">
                    <label>Niveau (1-10)</label>
                    <select name="niveau" className="form-control">
                      <option value="">-- Aucun --</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                )}
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
