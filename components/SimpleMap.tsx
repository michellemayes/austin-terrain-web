'use client';

import { useEffect, useState } from 'react';

export default function SimpleMap() {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    setStatus('Loading Leaflet...');

    // Load CSS first
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const cssLink2 = document.createElement('link');
    cssLink2.rel = 'stylesheet';
    cssLink2.href = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css';
    document.head.appendChild(cssLink2);

    // Load Leaflet from CDN
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setStatus('Loading Leaflet Draw...');
      const script2 = document.createElement('script');
      script2.src = 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.js';
      script2.onload = () => {
        setStatus('Creating map...');
        setTimeout(() => {
          try {
            const L = (window as any).L;
            const map = L.map('simple-map').setView([30.2672, -97.7431], 11);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map);

            setStatus('Map loaded!');
          } catch (err) {
            console.error('Error creating map:', err);
            setStatus('Error: ' + (err as Error).message);
          }
        }, 100);
      };
      script2.onerror = () => setStatus('Failed to load Leaflet Draw');
      document.body.appendChild(script2);
    };
    script.onerror = () => setStatus('Failed to load Leaflet');
    document.body.appendChild(script);

    return () => {
      document.head.removeChild(cssLink);
      document.head.removeChild(cssLink2);
    };
  }, [isClient]);

  if (!isClient) {
    return <div className="h-[600px] w-full bg-gray-100 rounded-lg border flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  return (
    <div className="relative">
      <div id="simple-map" className="h-[600px] w-full rounded-lg border-2 border-gray-300" />
      {status !== 'Map loaded!' && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded shadow">
          <p className="text-sm">{status}</p>
        </div>
      )}
    </div>
  );
}

