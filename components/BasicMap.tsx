'use client';

import { useEffect, useState, useRef } from 'react';
import { Coordinate } from '@/types';
import { calculateAreaInAcres, areAllInAustinArea } from '@/lib/geoUtils';

interface BasicMapProps {
  onAreaSelected?: (coordinates: Coordinate[], areaAcres: number) => void;
  maxAreaAcres?: number;
}

export default function BasicMap({ onAreaSelected, maxAreaAcres = 1000 }: BasicMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const mapInstanceRef = useRef<any>(null);
  const drawnItemsRef = useRef<any>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    console.log('[BasicMap] Component mounting...');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      console.log('[BasicMap] Waiting for mount or window...');
      return;
    }

    // Prevent double initialization in React Strict Mode
    if (hasInitialized.current) {
      console.log('[BasicMap] Already initialized, skipping...');
      return;
    }
    hasInitialized.current = true;

    console.log('[BasicMap] Starting to load resources...');

    // Add Leaflet CSS
    if (!document.querySelector('#leaflet-css')) {
      console.log('[BasicMap] Adding Leaflet CSS...');
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet Draw CSS
    if (!document.querySelector('#leaflet-draw-css')) {
      console.log('[BasicMap] Adding Leaflet Draw CSS...');
      const link = document.createElement('link');
      link.id = 'leaflet-draw-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
      document.head.appendChild(link);
    }

    // Load Leaflet
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      console.log('[BasicMap] Leaflet loaded! Loading Leaflet Draw...');
      
      // Load Leaflet Draw
      const drawScript = document.createElement('script');
      drawScript.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
      drawScript.async = true;
      drawScript.onload = () => {
        console.log('[BasicMap] Leaflet Draw loaded! Initializing map...');
        
        setTimeout(() => {
          const L = (window as any).L;
          if (!L) {
            console.error('[BasicMap] Leaflet not available!');
            return;
          }

          try {
            console.log('[BasicMap] Creating map instance...');
            
            // Fix icon paths
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Create map
            const map = L.map('basic-map-container').setView([30.2672, -97.7431], 11);
            mapInstanceRef.current = map;
            console.log('[BasicMap] Map created!');
            
            // Add tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }).addTo(map);
            console.log('[BasicMap] Tiles added!');

            // Create feature group for drawn items
            const drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            drawnItemsRef.current = drawnItems;
            console.log('[BasicMap] Feature group added!');

            // Add draw control
            const drawControl = new L.Control.Draw({
              position: 'topright',
              draw: {
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                  shapeOptions: {
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                  },
                },
                rectangle: {
                  shapeOptions: {
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.3,
                  },
                },
                polyline: false,
                circle: false,
                marker: false,
                circlemarker: false,
              },
              edit: {
                featureGroup: drawnItems,
                remove: true,
              },
            });
            map.addControl(drawControl);
            console.log('[BasicMap] Draw controls added!');

            // Handle polygon creation
            map.on(L.Draw.Event.CREATED, (event: any) => {
              console.log('[BasicMap] Polygon created!', event);
              setShowTooltip(false); // Hide tooltip once user draws
              const layer = event.layer;
              
              // Clear previous drawings
              drawnItems.clearLayers();
              
              // Add new layer
              drawnItems.addLayer(layer);
              console.log('[BasicMap] Layer added to map, should be visible');

              const latlngs = layer.getLatLngs()[0];
              const coordinates: Coordinate[] = latlngs.map((ll: any) => ({
                lat: ll.lat,
                lng: ll.lng,
              }));

              console.log('[BasicMap] Coordinates:', coordinates);

              if (!areAllInAustinArea(coordinates)) {
                console.warn('[BasicMap] Area not in Austin bounds');
                alert('Selected area must be within the Austin region');
                drawnItems.clearLayers();
                return;
              }

              const areaAcres = calculateAreaInAcres(coordinates);
              console.log('[BasicMap] Area calculated:', areaAcres, 'acres');

              if (areaAcres > maxAreaAcres) {
                console.warn('[BasicMap] Area too large:', areaAcres);
                alert(`Selected area (${areaAcres.toFixed(2)} acres) exceeds maximum of ${maxAreaAcres} acres`);
                drawnItems.clearLayers();
                return;
              }

              console.log('[BasicMap] Polygon is valid! Keeping it visible on map.');
              console.log('[BasicMap] Calling onAreaSelected callback');
              
              if (onAreaSelected) {
                // Use a stable callback to prevent re-renders from clearing the map
                window.requestAnimationFrame(() => {
                  onAreaSelected(coordinates, areaAcres);
                });
              }
            });

            setMapReady(true);
            console.log('[BasicMap] ✅ Map fully ready!');
          } catch (err) {
            console.error('[BasicMap] Error creating map:', err);
          }
        }, 100);
      };
      drawScript.onerror = () => console.error('[BasicMap] Failed to load Leaflet Draw');
      document.body.appendChild(drawScript);
    };
    script.onerror = () => console.error('[BasicMap] Failed to load Leaflet');
    document.body.appendChild(script);

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        console.log('[BasicMap] Cleaning up map...');
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          hasInitialized.current = false;
        } catch (err) {
          console.warn('[BasicMap] Error cleaning up map:', err);
        }
      }
    };
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="h-[600px] w-full bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] w-full">
      <div 
        id="basic-map-container" 
        className="h-full w-full rounded-lg border-2 border-gray-300 shadow-lg"
        style={{ zIndex: 0 }}
      />
      {!mapReady && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map controls...</p>
          </div>
        </div>
      )}
      
      {/* Drawing Tools Tooltip */}
      {mapReady && showTooltip && (
        <div className="absolute top-4 left-4 right-4 md:right-auto md:max-w-md bg-amber-50 border-2 border-amber-300 text-amber-900 px-4 py-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm">
              Use the drawing tools in the top-right corner to select your area
            </p>
            <button
              onClick={() => setShowTooltip(false)}
              className="p-1 hover:bg-amber-200 rounded transition-colors text-amber-700"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
