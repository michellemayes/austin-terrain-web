'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import { Coordinate } from '@/types';
import { calculateAreaInAcres, areAllInAustinArea } from '@/lib/geoUtils';

// Fix for Leaflet marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapSelectorProps {
  onAreaSelected: (coordinates: Coordinate[], areaAcres: number) => void;
  maxAreaAcres?: number;
}

export default function MapSelector({ 
  onAreaSelected, 
  maxAreaAcres = 10 
}: MapSelectorProps) {
  const mapRef = useRef<L.Map | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<number>(0);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapRef.current) return; // Map already initialized

    try {
      console.log('Initializing map...');
      // Initialize map centered on Austin
      const map = L.map('map').setView([30.2672, -97.7431], 11);
      mapRef.current = map;
      
      console.log('Map initialized, loading tiles...');

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize feature group for drawn items
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

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
      
      // Clear previous drawings
      drawnItems.clearLayers();
      drawnItems.addLayer(layer);

      // Get coordinates
      const latlngs = layer.getLatLngs()[0];
      const coordinates: Coordinate[] = latlngs.map((ll: L.LatLng) => ({
        lat: ll.lat,
        lng: ll.lng,
      }));

      // Validate area is in Austin
      if (!areAllInAustinArea(coordinates)) {
        setError('Selected area must be within the Austin region');
        drawnItems.clearLayers();
        setSelectedArea(0);
        return;
      }

      // Calculate area
      const areaAcres = calculateAreaInAcres(coordinates);
      setSelectedArea(areaAcres);

      // Validate area size
      if (areaAcres > maxAreaAcres) {
        setError(`Selected area (${areaAcres.toFixed(2)} acres) exceeds maximum of ${maxAreaAcres} acres`);
        drawnItems.clearLayers();
        setSelectedArea(0);
        return;
      }

      setError('');
      onAreaSelected(coordinates, areaAcres);
    });

    // Handle polygon editing
    map.on(L.Draw.Event.EDITED, (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const latlngs = layer.getLatLngs()[0];
        const coordinates: Coordinate[] = latlngs.map((ll: L.LatLng) => ({
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
    });

    // Handle polygon deletion
    map.on(L.Draw.Event.DELETED, () => {
      setError('');
      setSelectedArea(0);
    });

      // Map is ready
      setIsMapReady(true);
      console.log('Map fully loaded and ready');

      // Cleanup
      return () => {
        map.remove();
        mapRef.current = null;
        setIsMapReady(false);
      };
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map. Please refresh the page.');
    }
  }, [maxAreaAcres, onAreaSelected]);

  return (
    <div className="relative">
      <div id="map" className="h-[600px] w-full rounded-lg border-2 border-gray-300 shadow-lg" />
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

