import React, { useState } from 'react';
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Layers, Navigation } from 'lucide-react';

function App() {
  const [viewState, setViewState] = useState({
    latitude: -18.8792,
    longitude: 47.5079,
    zoom: 13
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Antananarivo Map
                </h1>
                <p className="text-sm text-slate-500">Système de cartographie professionnel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <Layers className="w-4 h-4 inline mr-2" />
                Couches
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors">
                Exporter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-slate-700" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Antananarivo, Madagascar
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Latitude: {viewState.latitude.toFixed(4)} | Longitude: {viewState.longitude.toFixed(4)} | Zoom: {viewState.zoom.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <Map
            mapLib={maplibregl}
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: '100%', height: '600px' }}
            mapStyle="http://localhost:8088/styles/basic-preview/style.json"
          >
            {/* Custom Marker */}
            <Marker 
              latitude={-18.8792} 
              longitude={47.5079}
              anchor="bottom"
            >
              <div className="relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                  Antananarivo
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                </div>
                <div className="w-8 h-8 bg-slate-900 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" fill="white" />
                </div>
              </div>
            </Marker>

            {/* Map Controls */}
            <NavigationControl position="top-right" />
            <ScaleControl position="bottom-right" />
          </Map>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Plateforme de cartographie professionnelle • Données OpenStreetMap
        </div>
      </main>
    </div>
  );
}

export default App;