'use client';

import { useEffect, useRef, useState } from 'react';
import { Coordinate } from '@/types';
import { calculateAreaInAcres, areAllInAustinArea } from '@/lib/geoUtils';

interface MapSelectorProps {
  onAreaSelected: (coordinates: Coordinate[], areaAcres: number) => void;
  maxAreaAcres?: number;
}

export default function MapSelectorSimple({ 
  onAreaSelected, 
  maxAreaAcres = 10 
}: MapSelectorProps) {
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [error, setError] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (mapInstanceRef.current) return;

    setIsLoading(true);

    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      import('leaflet-draw').then(() => {
        try {
          console.log('Creating map...');
          
          // Fix Leaflet icon paths
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });

          const map = L.map('map-container').setView([30.2672, -97.7431], 11);
          mapInstanceRef.current = map;

          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map);

          // Initialize feature group for drawn items
          const drawnItems = new L.FeatureGroup();
          map.addLayer(drawnItems);

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

          // Handle polygon creation
          map.on(L.Draw.Event.CREATED, (event: any) => {
            const layer = event.layer;
            drawnItems.clearLayers();
            drawnItems.addLayer(layer);

            const latlngs = layer.getLatLngs()[0];
            const coordinates: Coordinate[] = latlngs.map((ll: any) => ({
              lat: ll.lat,
              lng: ll.lng,
            }));

            if (!areAllInAustinArea(coordinates)) {
              setError('Selected area must be within the Austin region');
              drawnItems.clearLayers();
              setSelectedArea(0);
              return;
            }

            const areaAcres = calculateAreaInAcres(coordinates);
            setSelectedArea(areaAcres);

            if (areaAcres > maxAreaAcres) {
              setError(`Selected area (${areaAcres.toFixed(2)} acres) exceeds maximum of ${maxAreaAcres} acres`);
              drawnItems.clearLayers();
              setSelectedArea(0);
              return;
            }

            setError('');
            onAreaSelected(coordinates, areaAcres);
          });

          setIsLoading(false);
          console.log('Map loaded successfully!');
        } catch (err) {
          console.error('Error creating map:', err);
          setError('Failed to load map');
          setIsLoading(false);
        }
      });
    }).catch((err) => {
      console.error('Error importing Leaflet:', err);
      setError('Failed to load map library');
      setIsLoading(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, maxAreaAcres, onAreaSelected]);

  if (!isClient) {
    return (
      <div className="h-[600px] w-full bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
        <p className="text-gray-600">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        id="map-container" 
        ref={mapRef}
        className="h-[600px] w-full rounded-lg border-2 border-gray-300 shadow-lg"
      />
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          {error}
        </div>
      )}
      {selectedArea > 0 && !error && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          Selected Area: {selectedArea.toFixed(2)} acres
        </div>
      )}
    </div>
  );
}

