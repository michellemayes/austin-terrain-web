import * as turf from '@turf/turf';
import { Coordinate, BoundingBox } from '@/types';

/**
 * Calculate the area of a polygon in acres
 */
export function calculateAreaInAcres(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0;
  
  // Close the polygon if not already closed
  const coords = [...coordinates];
  if (coords[0].lat !== coords[coords.length - 1].lat || 
      coords[0].lng !== coords[coords.length - 1].lng) {
    coords.push(coords[0]);
  }
  
  // Convert to turf polygon format [lng, lat]
  const turfCoords = coords.map(c => [c.lng, c.lat]);
  const polygon = turf.polygon([turfCoords]);
  
  // Get area in square meters
  const areaSquareMeters = turf.area(polygon);
  
  // Convert to acres (1 acre = 4046.86 square meters)
  const areaAcres = areaSquareMeters / 4046.86;
  
  return areaAcres;
}

/**
 * Calculate bounding box from coordinates
 */
export function calculateBoundingBox(coordinates: Coordinate[]): BoundingBox {
  if (coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }
  
  const lats = coordinates.map(c => c.lat);
  const lngs = coordinates.map(c => c.lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Check if a point is within the Austin area bounds
 * Austin area roughly: 30.0°N to 30.6°N, -98.2°W to -97.5°W
 */
export function isInAustinArea(coordinate: Coordinate): boolean {
  return (
    coordinate.lat >= 30.0 &&
    coordinate.lat <= 30.6 &&
    coordinate.lng >= -98.2 &&
    coordinate.lng <= -97.5
  );
}

/**
 * Maximum area limit in acres (set to a very large number to effectively disable)
 */
export const MAX_AREA_ACRES = 1000;

/**
 * Check if all coordinates are within Austin area
 */
export function areAllInAustinArea(coordinates: Coordinate[]): boolean {
  return coordinates.every(isInAustinArea);
}

/**
 * Format coordinate for display
 */
export function formatCoordinate(coord: Coordinate): string {
  return `${coord.lat.toFixed(6)}°, ${coord.lng.toFixed(6)}°`;
}

