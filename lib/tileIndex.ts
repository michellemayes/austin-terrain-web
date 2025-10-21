import * as turf from '@turf/turf';
import { BoundingBox } from '@/types';

const TILE_INDEX_URL = 'https://data.geographic.texas.gov/447db89a-58ee-4a1b-a61f-b918af2fb0bb/assets/bexar-travis-counties-lidar-tile-index.zip';

interface TileFeature {
  type: 'Feature';
  properties: {
    TILE_NAME?: string;
    filename?: string;
    name?: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface TileIndex {
  features: TileFeature[];
}

let cachedTileIndex: TileIndex | null = null;
let indexLoadPromise: Promise<TileIndex> | null = null;

/**
 * Load and parse the tile index from the zip file
 * Uses singleton pattern to cache the index in memory
 */
export async function loadTileIndex(): Promise<TileIndex> {
  // Return cached index if available
  if (cachedTileIndex) {
    console.log('[TileIndex] Using cached tile index');
    return cachedTileIndex;
  }

  // If already loading, return the existing promise
  if (indexLoadPromise) {
    console.log('[TileIndex] Waiting for existing tile index load...');
    return indexLoadPromise;
  }

  // Start loading the index
  indexLoadPromise = (async () => {
    try {
      console.log('[TileIndex] Downloading tile index from:', TILE_INDEX_URL);
      
      const response = await fetch(TILE_INDEX_URL);
      if (!response.ok) {
        throw new Error(`Failed to download tile index: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log('[TileIndex] Downloaded zip file:', arrayBuffer.byteLength, 'bytes');

      // For now, we'll need to handle the zip extraction
      // Since we can't easily extract zip in Node.js without dependencies,
      // let's try a direct approach: check if TNRIS provides a direct GeoJSON URL
      // Alternative: use a pre-extracted/converted version
      
      // TODO: For MVP, we'll create a simplified tile index based on known patterns
      // The TNRIS tiles follow a naming pattern like: TXDIR_28cm_n3027975_w09777745_DEM.tif
      // We can infer tile bounds from the filename (northing, westing in State Plane coordinates)
      
      // For now, return a mock structure that we'll populate with actual logic
      // In production, you'd extract the zip and parse the shapefile/GeoJSON
      
      const tileIndex: TileIndex = {
        features: []
      };

      // Since extracting zip files in the browser/Node is complex without additional deps,
      // and the tile index URL returns a zip, let's use an alternative approach:
      // Query the S3 bucket directly to list available tiles
      console.log('[TileIndex] Note: Using S3 listing approach instead of tile index zip');
      console.log('[TileIndex] This will query tiles on-demand rather than pre-loading an index');

      cachedTileIndex = tileIndex;
      return tileIndex;

    } catch (error) {
      console.error('[TileIndex] Error loading tile index:', error);
      indexLoadPromise = null;
      throw error;
    }
  })();

  return indexLoadPromise;
}

/**
 * Get tile names that intersect with the given bounding box
 * For now, uses S3 listing approach since tile index extraction is complex
 */
export function getTilesForBbox(bbox: BoundingBox, tileIndex: TileIndex): string[] {
  console.log('[TileIndex] Finding tiles for bbox:', bbox);

  // Since we're using S3 listing approach, we'll return tile names based on
  // the bbox coordinates. TNRIS DEM tiles follow a naming convention.
  // For this implementation, we'll use a simplified approach that lists
  // all potential tiles and filters them during download.
  
  // The tile naming convention appears to be based on State Plane coordinates
  // Example: TXDIR_28cm_n3027975_w09777745_DEM.tif
  // where n3027975 is northing (3,027,975 meters) and w09777745 is westing (977,745 meters)
  
  // For Austin area (Travis/Bexar counties):
  // Approximate State Plane TX Central zone coordinates
  // We'll need to convert WGS84 to State Plane
  
  // For MVP, we'll use a wildcard approach and let the download function handle specifics
  // Return a pattern that the download function can use to query S3
  
  const tiles: string[] = [];
  
  // Generate potential tile names based on bbox
  // This is a simplified approach - in production, you'd use the actual tile index
  
  // Austin area tiles (based on known coverage)
  // These would come from the tile index in a real implementation
  // For now, we'll use a heuristic based on the bbox
  
  const centerLat = (bbox.minLat + bbox.maxLat) / 2;
  const centerLng = (bbox.minLng + bbox.maxLng) / 2;
  
  // Austin is roughly at 30.27°N, -97.74°W
  // We'll use a simple grid approximation
  // Real implementation would use the actual tile index
  
  console.log('[TileIndex] Center point:', { lat: centerLat, lng: centerLng });
  console.log('[TileIndex] Using S3 wildcard search for tiles in this area');
  
  // Return empty array for now - the download function will handle S3 listing
  // This signals to use the fallback S3 listing approach
  return tiles;
}

/**
 * Alternative: List DEM tiles directly from S3 bucket
 * This is a fallback when tile index is not available
 */
export async function listDEMTilesFromS3(bbox: BoundingBox): Promise<string[]> {
  // This would use AWS SDK to list objects in the S3 bucket
  // with prefix matching the area of interest
  
  console.log('[TileIndex] Listing DEM tiles from S3 for bbox:', bbox);
  
  // For now, return a known tile for testing
  // In production, this would query S3
  const knownTiles = [
    'TXDIR_28cm_n3027975_w09777745_DEM.tif',
    'TXDIR_28cm_n3028475_w09777745_DEM.tif',
    // More tiles would be discovered via S3 listing
  ];
  
  console.log('[TileIndex] Found tiles (placeholder):', knownTiles.length);
  return knownTiles;
}

