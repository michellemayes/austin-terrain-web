import { BoundingBox } from '@/types';

const WMS_IMAGERY_URL = 'https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer';
const S3_DEM_BASE = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';
const S3_BUCKET_URL = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com';
const S3_DEM_PREFIX = 'LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';

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
 * List available DEM tiles from S3 bucket using HTTP
 * S3 bucket listing via XML API (public bucket, no auth needed)
 */
export async function listDEMTilesFromS3(bbox?: BoundingBox): Promise<string[]> {
  try {
    console.log('[DataFetcher] ═══════════════════════════════════════');
    console.log('[DataFetcher] Attempting to list DEM tiles from S3...');
    console.log('[DataFetcher] ═══════════════════════════════════════');
    
    // Try S3 XML API for listing
    const listUrl = `${S3_BUCKET_URL}?list-type=2&prefix=${S3_DEM_PREFIX}&max-keys=100`;
    console.log('[DataFetcher] List URL:', listUrl);
    
    const response = await fetch(listUrl);
    console.log('[DataFetcher] Response status:', response.status, response.statusText);
    console.log('[DataFetcher] Response content-type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      console.error(`[DataFetcher] S3 listing failed: ${response.status}`);
      const errorText = await response.text();
      console.error('[DataFetcher] Error response:', errorText.substring(0, 500));
      console.log('[DataFetcher] Falling back to browsing approach...');
      return await discoverTilesViaBrowsing();
    }
    
    const xmlText = await response.text();
    console.log('[DataFetcher] Received XML response, length:', xmlText.length);
    console.log('[DataFetcher] First 500 chars:', xmlText.substring(0, 500));
    
    // Parse XML to extract tile keys
    const keyMatches = xmlText.matchAll(/<Key>([^<]+)<\/Key>/g);
    const tiles: string[] = [];
    
    for (const match of keyMatches) {
      const fullKey = match[1];
      if (fullKey.endsWith('.tif')) {
        const tileName = fullKey.replace(S3_DEM_PREFIX, '');
        // Accept any .tif file that looks like a DEM tile (exclude metadata files)
        // Tile names look like: stratmap21-1ft_3097264c3.tif
        if (tileName.length > 0 && tileName.includes('stratmap')) {
          tiles.push(tileName);
          if (tiles.length <= 5) {
            console.log('[DataFetcher] Added tile:', tileName);
          }
        }
      }
    }
    
    console.log(`[DataFetcher] ✅ Found ${tiles.length} elevation tiles via S3 listing`);
    
    if (tiles.length === 0) {
      console.warn('[DataFetcher] No tiles found via XML parsing, trying browse approach');
      return await discoverTilesViaBrowsing();
    }
    
    if (tiles.length > 0) {
      console.log('[DataFetcher] Sample tiles:', tiles.slice(0, 5));
    }
    
    return tiles;
  } catch (error) {
    console.error('[DataFetcher] Error listing S3 tiles:', error);
    console.log('[DataFetcher] Trying browse approach as fallback');
    return await discoverTilesViaBrowsing();
  }
}

/**
 * Try to discover tiles by browsing the S3 directory structure
 */
async function discoverTilesViaBrowsing(): Promise<string[]> {
  console.log('[DataFetcher] Attempting to discover tiles via directory browsing...');
  
  // Try to access the index.html page that S3 provides
  const browseUrl = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/index.html?prefix=LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';
  console.log('[DataFetcher] Browse URL:', browseUrl);
  
  try {
    const response = await fetch(browseUrl);
    if (response.ok) {
      const html = await response.text();
      console.log('[DataFetcher] Got HTML response, length:', html.length);
      
      // Try to extract .tif filenames from the HTML
      const tifMatches = html.matchAll(/>(stratmap[^<]+\.tif)</gi);
      const tiles: string[] = [];
      
      for (const match of tifMatches) {
        const tileName = match[1];
        tiles.push(tileName);
      }
      
      if (tiles.length > 0) {
        console.log(`[DataFetcher] ✅ Discovered ${tiles.length} tiles via browsing`);
        console.log('[DataFetcher] Sample:', tiles.slice(0, 5));
        return tiles;
      }
    }
  } catch (error) {
    console.error('[DataFetcher] Browse discovery failed:', error);
  }
  
  // Final fallback: return empty array to trigger error message
  console.error('[DataFetcher] ❌ Could not discover any tiles');
  console.error('[DataFetcher] The S3 bucket may not be publicly accessible or the structure has changed');
  return [];
}


/**
 * Download a single DEM tile from S3 using HTTP fetch (public bucket)
 * Returns null if tile doesn't exist (404)
 */
export async function downloadDEMTile(tileName: string): Promise<ArrayBuffer | null> {
  try {
    console.log('[DataFetcher] Downloading DEM tile:', tileName);
    
    const url = `${S3_DEM_BASE}${tileName}`;
    console.log('[DataFetcher] Tile URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[DataFetcher] Tile not found (404): ${tileName}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    console.log(`[DataFetcher] ✅ Downloaded ${tileName}: ${arrayBuffer.byteLength} bytes`);
    return arrayBuffer;
    
  } catch (error) {
    console.error(`[DataFetcher] Error downloading tile ${tileName}:`, error);
    return null;
  }
}

/**
 * Download multiple DEM tiles in parallel with concurrency limit
 */
export async function downloadMultipleDEMTiles(tileNames: string[], concurrency: number = 3): Promise<ArrayBuffer[]> {
  console.log(`[DataFetcher] Downloading ${tileNames.length} tiles with concurrency ${concurrency}`);
  
  const results: ArrayBuffer[] = [];
  
  // Process tiles in batches to limit concurrency
  for (let i = 0; i < tileNames.length; i += concurrency) {
    const batch = tileNames.slice(i, i + concurrency);
    console.log(`[DataFetcher] Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(tileNames.length / concurrency)}`);
    
    const batchPromises = batch.map(async (tileName) => {
      const buffer = await downloadDEMTile(tileName);
      return { buffer, tileName };
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Collect successful downloads (non-null buffers)
    for (const result of batchResults) {
      if (result.buffer) {
        results.push(result.buffer);
      }
    }
  }
  
  console.log(`[DataFetcher] Successfully downloaded ${results.length}/${tileNames.length} tiles`);
  
  if (results.length === 0 && tileNames.length > 0) {
    console.error('[DataFetcher] ❌ No tiles were successfully downloaded');
    console.error('[DataFetcher] This likely means the tile names are incorrect or the S3 bucket structure has changed');
    console.error('[DataFetcher] Attempted tiles:', tileNames.slice(0, 5));
    throw new Error('Failed to download any DEM tiles. The tiles may not exist in the S3 bucket.');
  }
  
  return results;
}

/**
 * Filter tiles to only those that intersect with the bounding box
 * This is a heuristic based on tile naming convention
 */
export function filterTilesByBoundingBox(tileNames: string[], bbox: BoundingBox): string[] {
  console.log('[DataFetcher] Filtering', tileNames.length, 'tiles by bbox:', bbox);
  
  if (tileNames.length === 0) {
    console.warn('[DataFetcher] No tiles to filter');
    return [];
  }
  
  // Tile naming convention: stratmap21-1ft_3097264c3.tif
  // The numbers appear to be grid coordinates, but without full documentation,
  // we'll use a simple approach: select tiles that are likely to cover the area
  
  // For now, select tiles based on the coordinate numbers in the filename
  // Austin downtown is roughly at 30.27°N, -97.74°W
  // The numbers 3097xxx suggest a grid system
  
  const austinTiles = tileNames.filter(name => {
    // Extract the coordinate numbers from filenames like stratmap21-1ft_3097264c3.tif
    const match = name.match(/(\d{7})/);
    if (!match) return true; // Include if we can't parse
    
    const gridNum = parseInt(match[1]);
    
    // Austin area tiles seem to be in the 3097xxx range
    // Include tiles in a reasonable range around Austin
    const isAustinArea = gridNum >= 3096000 && gridNum <= 3099000;
    
    return isAustinArea;
  });
  
  console.log(`[DataFetcher] Filtered to ${austinTiles.length} potential Austin-area tiles`);
  
  if (austinTiles.length === 0) {
    console.warn('[DataFetcher] No filtered tiles found, using first available tiles');
    const MAX_TILES = 5;
    const filtered = tileNames.slice(0, MAX_TILES);
    console.log(`[DataFetcher] Using ${filtered.length} tiles (first available)`);
    console.log('[DataFetcher] Selected tiles:', filtered);
    return filtered;
  }
  
  // Limit to a reasonable number for performance
  const MAX_TILES = 5;
  const filtered = austinTiles.slice(0, MAX_TILES);
  
  console.log(`[DataFetcher] Using ${filtered.length} tiles (max ${MAX_TILES} for performance)`);
  console.log('[DataFetcher] Selected tiles:', filtered);
  return filtered;
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

