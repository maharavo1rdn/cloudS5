import React, { useState } from 'react';
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Layers, Navigation, Download, Maximize2 } from 'lucide-react';

function App() {
  const [viewState, setViewState] = useState({
    latitude: -18.8792,
    longitude: 47.5079,
    zoom: 13
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <Navigation size={24} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 4px 0',
                letterSpacing: '-0.025em'
              }}>
                Antananarivo Map
              </h1>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: 0,
                fontWeight: '500'
              }}>
                Système de cartographie professionnel
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#475569',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}>
              <Layers size={16} />
              Couches
            </button>
            
            <button style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
        {/* Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MapPin size={28} color="#475569" strokeWidth={2} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 8px 0',
                letterSpacing: '-0.025em'
              }}>
                Antananarivo, Madagascar
              </h2>
              <div style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                fontSize: '14px',
                color: '#64748b',
                fontWeight: '500'
              }}>
                <span>Latitude: {viewState.latitude.toFixed(4)}</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>Longitude: {viewState.longitude.toFixed(4)}</span>
                <span style={{ color: '#cbd5e1' }}>•</span>
                <span>Zoom: {viewState.zoom.toFixed(1)}x</span>
              </div>
            </div>
            <button style={{
              padding: '8px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}>
              <Maximize2 size={18} color="#475569" />
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 10px 15px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          <Map
            mapLib={maplibregl}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '650px' }}
            mapStyle="http://localhost:8088/styles/basic-preview/style.json"
          >
            {/* Custom Marker */}
            <Marker 
              latitude={-18.8792} 
              longitude={47.5079}
              anchor="bottom"
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  top: '-56px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  letterSpacing: '0.01em'
                }}>
                  Antananarivo
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translate(-50%, 100%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: '6px solid #1e293b'
                  }}></div>
                </div>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                  borderRadius: '50%',
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MapPin size={22} color="white" fill="white" strokeWidth={0} />
                </div>
              </div>
            </Marker>

            {/* Map Controls */}
            <NavigationControl position="top-right" style={{ margin: '16px' }} />
            <ScaleControl position="bottom-right" style={{ margin: '16px' }} />
          </Map>
        </div>

        {/* Footer Info */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#94a3b8',
          fontWeight: '500'
        }}>
          Plateforme de cartographie professionnelle • Données OpenStreetMap
        </div>
      </main>
    </div>
  );
}

export default App;