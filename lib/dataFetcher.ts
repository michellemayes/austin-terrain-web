import { BoundingBox } from '@/types';

const WMS_IMAGERY_URL = 'https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer';
const S3_DEM_BASE = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';

/**
 * Create a fallback texture when real imagery isn't available
 */
async function createFallbackTexture(width: number, height: number): Promise<Blob> {
  console.log('[DataFetcher] Creating fallback texture:', width, 'x', height);
  
  // Create a simple tan/beige colored PNG
  // This is a minimal 1x1 PNG in tan color (#D2B48C)
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'image/png' });
}

/**
 * Calculate a "safe" WMS bounding box from a center point
 * Using fixed ground resolution to avoid WMS issues
 */
function calculateWMSBBox(bbox: BoundingBox, width: number, height: number): string {
  // Calculate center point of the bounding box
  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  const centerLng = (bbox.minLng + bbox.maxLng) / 2;
  
  console.log('[DataFetcher] Original bbox:', bbox);
  console.log('[DataFetcher] Center point:', centerLat, ',', centerLng);
  
  // Fixed ground resolution in meters per pixel
  // 0.35 is good for 30-15 cm imagery
  const mpp = 0.35;
  
  // Calculate span in meters
  const span_x = mpp * width;
  const span_y = mpp * height;
  
  console.log('[DataFetcher] Span in meters:', span_x, 'x', span_y);
  
  // Convert meters to degrees
  const deg_lon = span_x / (111320 * Math.cos(centerLat * Math.PI / 180));
  const deg_lat = span_y / 110574;
  
  console.log('[DataFetcher] Span in degrees:', deg_lon, 'x', deg_lat);
  
  // Build bbox from center point
  const wmsBBox = {
    minLng: centerLng - deg_lon / 2,
    minLat: centerLat - deg_lat / 2,
    maxLng: centerLng + deg_lon / 2,
    maxLat: centerLat + deg_lat / 2,
  };
  
  const bboxString = `${wmsBBox.minLng},${wmsBBox.minLat},${wmsBBox.maxLng},${wmsBBox.maxLat}`;
  console.log('[DataFetcher] Calculated WMS bbox:', bboxString);
  
  return bboxString;
}

/**
 * Fetch imagery from TNRIS WMS server
 */
export async function fetchImageryFromWMS(
  bbox: BoundingBox,
  width: number = 1024,
  height: number = 1024
): Promise<Blob> {
  // Calculate proper WMS bbox from center point with fixed resolution
  const wmsBBox = calculateWMSBBox(bbox, width, height);
  
  // For ArcGIS ImageServer WMS
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    LAYERS: 'StratMap21_NCCIR_CapArea_Brazos_Kerr',
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    SRS: 'EPSG:4326',
    BBOX: wmsBBox,
    WIDTH: width.toString(),
    HEIGHT: height.toString(),
  });

  const url = `${WMS_IMAGERY_URL}?${params.toString()}`;
  console.log('[DataFetcher] WMS URL:', url);
  
  const response = await fetch(url);
  console.log('[DataFetcher] WMS Response status:', response.status, response.statusText);
  console.log('[DataFetcher] WMS Response headers:', Object.fromEntries(response.headers.entries()));
  
  const blob = await response.blob();
  console.log('[DataFetcher] Blob size:', blob.size, 'bytes, type:', blob.type);
  
  // Check if we got an error message or suspiciously small image
  if (!blob.type.includes('image')) {
    const text = await blob.text();
    console.error('[DataFetcher] WMS returned non-image response:', text.substring(0, 500));
    console.warn('[DataFetcher] Area may be outside imagery coverage, using fallback texture');
    
    // Return a solid color fallback image (gray/tan color for terrain)
    const fallbackImage = await createFallbackTexture(width, height);
    return fallbackImage;
  }
  
  // Warn if image is suspiciously small (likely empty/transparent)
  const expectedMinSize = (width * height) / 100; // Very rough estimate
  if (blob.size < expectedMinSize) {
    console.warn('[DataFetcher] ⚠️  Image is suspiciously small (' + blob.size + ' bytes)');
    console.warn('[DataFetcher] This area may have limited or no imagery coverage');
    console.warn('[DataFetcher] The texture may appear blank or low quality');
  }
  
  if (!response.ok) {
    throw new Error(`Failed to fetch imagery: ${response.statusText}`);
  }
  
  return blob;
}

/**
 * List available DEM tiles from S3
 * This is a simplified version - in production, you'd want to parse the S3 bucket listing
 */
export async function listDEMTiles(): Promise<string[]> {
  // For now, return empty array - will need to implement S3 bucket listing
  // or pre-populate with known tile names
  return [];
}

/**
 * Fetch DEM tile from S3
 */
export async function fetchDEMTile(tileName: string): Promise<ArrayBuffer> {
  const url = `${S3_DEM_BASE}${tileName}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch DEM tile: ${response.statusText}`);
  }
  
  return response.arrayBuffer();
}

/**
 * Determine which DEM tiles are needed for a given bounding box
 * This is a placeholder - actual implementation would need tile index
 */
export function getDEMTilesForBoundingBox(bbox: BoundingBox): string[] {
  // This would need to be implemented based on the actual tile naming convention
  // and spatial index of available tiles
  return [];
}

/**
 * Convert blob to data URL for display
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Note: createFallbackTexture is declared above but this export makes it available if needed
 */

