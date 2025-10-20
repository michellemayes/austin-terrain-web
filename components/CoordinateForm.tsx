'use client';

import { useState } from 'react';
import { Coordinate } from '@/types';
import { calculateAreaInAcres, areAllInAustinArea } from '@/lib/geoUtils';

interface CoordinateFormProps {
  onCoordinatesSubmit: (coordinates: Coordinate[], areaAcres: number) => void;
  maxAreaAcres?: number;
}

export default function CoordinateForm({ 
  onCoordinatesSubmit, 
  maxAreaAcres = 1000 
}: CoordinateFormProps) {
  const [coordinateText, setCoordinateText] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Parse coordinates from text
      // Expected format: lat1,lng1 lat2,lng2 lat3,lng3 ...
      const lines = coordinateText.trim().split('\n');
      const coordinates: Coordinate[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const [latStr, lngStr] = trimmed.split(/[,\s]+/);
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
          setError(`Invalid coordinate: ${line}`);
          return;
        }

        coordinates.push({ lat, lng });
      }

      if (coordinates.length < 3) {
        setError('At least 3 coordinates are required to form a polygon');
        return;
      }

      // Validate coordinates are in Austin area
      if (!areAllInAustinArea(coordinates)) {
        setError('All coordinates must be within the Austin area (30.0-30.6°N, -98.2--97.5°W)');
        return;
      }

      // Calculate area
      const areaAcres = calculateAreaInAcres(coordinates);

      if (areaAcres > maxAreaAcres) {
        setError(`Area (${areaAcres.toFixed(2)} acres) exceeds maximum of ${maxAreaAcres} acres`);
        return;
      }

      onCoordinatesSubmit(coordinates, areaAcres);
      setError('');
    } catch (err) {
      setError('Error parsing coordinates. Please check format.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Enter Coordinates</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="coordinates" className="block text-sm font-medium text-gray-700 mb-2">
            Coordinates (one per line: latitude, longitude)
          </label>
          <textarea
            id="coordinates"
            value={coordinateText}
            onChange={(e) => setCoordinateText(e.target.value)}
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder={`30.2672, -97.7431
30.2673, -97.7430
30.2671, -97.7429
30.2670, -97.7432`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter at least 3 coordinates to define a polygon. Format: lat, lng (one per line)
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Submit Coordinates
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
        <p className="font-medium mb-1">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Coordinates must be within Austin area</li>
          <li>Use decimal degrees format</li>
          <li>At least 3 coordinates required</li>
        </ul>
      </div>
    </div>
  );
}

