import React, { useState, useMemo } from 'react';
import Map, { Marker, NavigationControl, ScaleControl, Popup } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useSignalements } from '../../context/SignalementContext';
import './MapView.css';

const MapView = ({ onMarkerClick }) => {
  const { signalements } = useSignalements();
  const [viewState, setViewState] = useState({
    latitude: -18.8792,
    longitude: 47.5079,
    zoom: 13
  });
  const [hoveredSignalement, setHoveredSignalement] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);

  // Couleurs selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'nouveau':
        return '#ef4444'; // Rouge
      case 'en_cours':
        return '#f59e0b'; // Orange
      case 'termine':
        return '#22c55e'; // Vert
      default:
        return '#64748b';
    }
  };

  // Icône selon le statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'nouveau':
        return <AlertCircle size={16} />;
      case 'en_cours':
        return <Clock size={16} />;
      case 'termine':
        return <CheckCircle size={16} />;
      default:
        return <MapPin size={16} />;
    }
  };

  // Label du statut
  const getStatusLabel = (status) => {
    switch (status) {
      case 'nouveau':
        return 'Nouveau';
      case 'en_cours':
        return 'En cours';
      case 'termine':
        return 'Terminé';
      default:
        return status;
    }
  };

  // Formater le budget
  const formatBudget = (budget) => {
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(1)} M Ar`;
    }
    return `${budget.toLocaleString()} Ar`;
  };

  return (
    <div className="map-container">
      <Map
        mapLib={maplibregl}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="http://localhost:8088/styles/basic-preview/style.json"
      >
        {/* Markers pour chaque signalement */}
        {signalements.map((signalement) => (
          <Marker
            key={signalement.id}
            latitude={signalement.latitude}
            longitude={signalement.longitude}
            anchor="bottom"
          >
            <div
              className="marker-container"
              onMouseEnter={() => setHoveredSignalement(signalement)}
              onMouseLeave={() => setHoveredSignalement(null)}
              onClick={() => {
                setPopupInfo(signalement);
                if (onMarkerClick) onMarkerClick(signalement);
              }}
            >
              <div
                className="marker-pin"
                style={{ backgroundColor: getStatusColor(signalement.status) }}
              >
                <MapPin size={20} color="white" fill="white" strokeWidth={0} />
              </div>
              
              {/* Tooltip au survol */}
              {hoveredSignalement?.id === signalement.id && (
                <div className="marker-tooltip">
                  <div className="tooltip-header">
                    <span 
                      className="tooltip-status"
                      style={{ backgroundColor: getStatusColor(signalement.status) }}
                    >
                      {getStatusIcon(signalement.status)}
                      {getStatusLabel(signalement.status)}
                    </span>
                    <span className="tooltip-date">{signalement.date}</span>
                  </div>
                  <div className="tooltip-content">
                    <p className="tooltip-description">{signalement.description}</p>
                    <p className="tooltip-address">{signalement.adresse}</p>
                    <div className="tooltip-details">
                      <span>Surface: {signalement.surface} m²</span>
                      <span>Budget: {formatBudget(signalement.budget)}</span>
                    </div>
                    {signalement.entreprise && (
                      <p className="tooltip-entreprise">
                        🏗️ {signalement.entreprise}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Marker>
        ))}

        {/* Popup pour affichage détaillé */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="custom-popup"
          >
            <div className="popup-content">
              <div className="popup-header">
                <span 
                  className="popup-status"
                  style={{ backgroundColor: getStatusColor(popupInfo.status) }}
                >
                  {getStatusIcon(popupInfo.status)}
                  {getStatusLabel(popupInfo.status)}
                </span>
              </div>
              <h3>{popupInfo.description}</h3>
              <p className="popup-address">{popupInfo.adresse}</p>
              <div className="popup-info-grid">
                <div className="popup-info-item">
                  <span className="label">Date</span>
                  <span className="value">{popupInfo.date}</span>
                </div>
                <div className="popup-info-item">
                  <span className="label">Surface</span>
                  <span className="value">{popupInfo.surface} m²</span>
                </div>
                <div className="popup-info-item">
                  <span className="label">Budget</span>
                  <span className="value">{formatBudget(popupInfo.budget)}</span>
                </div>
                <div className="popup-info-item">
                  <span className="label">Entreprise</span>
                  <span className="value">{popupInfo.entreprise || 'Non assignée'}</span>
                </div>
              </div>
            </div>
          </Popup>
        )}

        {/* Contrôles de la carte */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
      </Map>

      {/* Légende */}
      <div className="map-legend">
        <h4>Légende</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span>
          Nouveau
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
          En cours
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#22c55e' }}></span>
          Terminé
        </div>
      </div>
    </div>
  );
};

export default MapView;
