import { BoundingBox } from '@/types';

const WMS_IMAGERY_URL = 'https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer';
const S3_DEM_BASE = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';

/**
 * Fetch imagery from TNRIS WMS server
 */
export async function fetchImageryFromWMS(
  bbox: BoundingBox,
  width: number = 2048,
  height: number = 2048
): Promise<Blob> {
  // For ArcGIS ImageServer WMS
  // Try common layer names - sometimes it's just the service name or '0' or empty
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    LAYERS: 'StratMap21_NCCIR_CapArea_Brazos_Kerr', // Try the service name as layer
    FORMAT: 'image/png',
    TRANSPARENT: 'true',
    SRS: 'EPSG:4326',
    BBOX: `${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
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
  
  // Check if we got an error message instead of an image
  if (blob.size < 1000 || !blob.type.includes('image')) {
    const text = await blob.text();
    console.error('[DataFetcher] WMS returned non-image response:', text.substring(0, 500));
    throw new Error(`WMS server returned error or invalid image (${blob.size} bytes, type: ${blob.type})`);
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

