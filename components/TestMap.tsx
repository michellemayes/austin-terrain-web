'use client';

import { useEffect, useState } from 'react';

export default function TestMap() {
  const [mounted, setMounted] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    console.log('TestMap: Starting to load Leaflet...');
    
    Promise.all([
      import('leaflet'),
      import('leaflet-draw')
    ])
      .then(([L]) => {
        console.log('TestMap: Leaflet loaded!');
        
        // Fix icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map('test-map').setView([30.2672, -97.7431], 11);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        console.log('TestMap: Map created successfully!');
        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('TestMap: Error loading:', err);
      });
  }, [mounted]);

  if (!mounted) {
    return <div className="h-[600px] w-full bg-gray-200 rounded-lg">Loading...</div>;
  }

  return (
    <div className="relative">
      <div id="test-map" className="h-[600px] w-full rounded-lg border-2 border-gray-300 shadow-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

