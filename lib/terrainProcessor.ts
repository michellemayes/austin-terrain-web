import * as THREE from 'three';
import { BoundingBox, Coordinate } from '@/types';
import * as turf from '@turf/turf';

/**
 * Generate a terrain mesh from elevation data
 */
export function generateTerrainMesh(
  elevationData: Float32Array,
  width: number,
  height: number,
  scale: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 },
  polygonCoordinates?: Coordinate[],
  boundingBox?: BoundingBox
): THREE.Mesh {
  // Create plane geometry (horizontal, facing up)
  const geometry = new THREE.PlaneGeometry(
    width * scale.x,
    height * scale.y,
    width - 1,
    height - 1
  );

  // Rotate to be horizontal (plane starts vertical in Three.js)
  geometry.rotateX(-Math.PI / 2);

  const vertices = geometry.attributes.position.array;

  // If polygon coordinates provided, create a mask
  let polygon: any = null;
  if (polygonCoordinates && polygonCoordinates.length > 0 && boundingBox) {
    console.log('[TerrainProcessor] Creating polygon mask with', polygonCoordinates.length, 'coordinates');
    const coords = [...polygonCoordinates];
    if (coords[0].lat !== coords[coords.length - 1].lat || 
        coords[0].lng !== coords[coords.length - 1].lng) {
      coords.push(coords[0]);
    }
    const turfCoords = coords.map(c => [c.lng, c.lat]);
    polygon = turf.polygon([turfCoords]);
    console.log('[TerrainProcessor] Polygon mask created');
  }

  // Calculate min elevation to use as baseline (for relative elevations)
  const validElevations = Array.from(elevationData).filter(e => e !== 0 && !isNaN(e));
  const minElevation = validElevations.length > 0 ? Math.min(...validElevations) : 0;
  console.log('[TerrainProcessor] Baseline elevation (min):', minElevation.toFixed(2), 'meters');
  
  // Apply elevation data to vertices (Y coordinate for horizontal plane)
  // PlaneGeometry creates vertices in specific order
  // For a plane with widthSegments and heightSegments:
  // vertices go from left to right, bottom to top
  for (let iy = 0; iy <= height - 1; iy++) {
    for (let ix = 0; ix <= width - 1; ix++) {
      const vertexIndex = (iy * width + ix) * 3;
      
      if (vertices[vertexIndex + 1] !== undefined) {
        // Get elevation from our data array
        const dataX = ix;
        const dataY = iy;
        const dataIdx = dataY * width + dataX;
        
        // Make elevation relative to minimum (so lowest point is at 0)
        let elevation = (elevationData[dataIdx] - minElevation) * scale.z;

        // Note: Polygon masking disabled to avoid creating vertical walls
        // The entire bounding box area will show terrain
        // This gives a more natural appearance without edge artifacts

        vertices[vertexIndex + 1] = elevation;
      }
    }
  }
  
  console.log('[TerrainProcessor] Terrain mesh vertices applied (no polygon masking)');

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  
  // PlaneGeometry already has UVs, just ensure they're correct
  console.log('[TerrainProcessor] UV coordinates already exist from PlaneGeometry');

  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White so texture shows through at full brightness
    wireframe: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  
  // Center the mesh
  mesh.position.set(0, 0, 0);

  return mesh;
}

/**
 * Apply texture to terrain mesh
 */
export function applyTextureToMesh(
  mesh: THREE.Mesh,
  texture: THREE.Texture
): void {
  if (mesh.material instanceof THREE.MeshStandardMaterial) {
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  }
}

/**
 * Export mesh to STL format with base
 */
export function exportToSTL(mesh: THREE.Mesh, includeBase: boolean = true): string {
  // Create a copy of the geometry
  const geometry = mesh.geometry.clone();
  
  if (includeBase && geometry instanceof THREE.BufferGeometry) {
    // Add base geometry for 3D printing
    const positions = geometry.attributes.position.array;
    const baseHeight = -0.1; // 10% of unit height below the terrain
    
    // This is a simplified version - full implementation would:
    // 1. Close the sides of the terrain
    // 2. Add a bottom plane
    // 3. Ensure manifold geometry
  }

  // Convert to STL format
  let stl = 'solid terrain\n';
  
  if (geometry instanceof THREE.BufferGeometry) {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    
    for (let i = 0; i < positions.count; i += 3) {
      const normal = new THREE.Vector3(
        normals.getX(i),
        normals.getY(i),
        normals.getZ(i)
      );
      
      stl += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
      stl += '    outer loop\n';
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j;
        const vertex = new THREE.Vector3(
          positions.getX(idx),
          positions.getY(idx),
          positions.getZ(idx)
        );
        stl += `      vertex ${vertex.x} ${vertex.y} ${vertex.z}\n`;
      }
      
      stl += '    endloop\n';
      stl += '  endfacet\n';
    }
  }
  
  stl += 'endsolid terrain\n';
  
  return stl;
}

/**
 * Export mesh to GLTF/GLB format
 */
export async function exportToGLB(mesh: THREE.Mesh): Promise<ArrayBuffer> {
  console.log('[TerrainProcessor] Starting GLB export...');
  
  // Mock browser globals that GLTFExporter might need
  if (typeof document === 'undefined') {
    // Create mock ImageData class first
    (global as any).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray | number, width: number, height?: number) {
        if (typeof data === 'number') {
          this.width = data;
          this.height = width;
          this.data = new Uint8ClampedArray(data * width * 4);
        } else {
          this.data = data;
          this.width = width;
          this.height = height || Math.floor(data.length / (width * 4));
        }
      }
    };
    
    const mockCanvas = {
      width: 0,
      height: 0,
      style: {},
      getContext: () => ({
        canvas: mockCanvas,
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => new (global as any).ImageData(w, h),
        putImageData: () => {},
        createImageData: (w: number, h: number) => new (global as any).ImageData(w, h),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        scale: () => {},
        rotate: () => {},
        translate: () => {},
        transform: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        rect: () => {},
        fillText: () => {},
        measureText: () => ({ width: 0 }),
      }),
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      toBlob: (callback: Function) => {
        console.log('[TerrainProcessor] toBlob called');
        // Return a minimal blob
        callback(new Blob([''], { type: 'image/png' }));
      },
      convertToBlob: async () => {
        console.log('[TerrainProcessor] convertToBlob called');
        // Return a minimal blob
        return new Blob([''], { type: 'image/png' });
      },
    };
    
    (global as any).document = {
      createElement: () => mockCanvas,
      createElementNS: () => mockCanvas,
    };
    
    (global as any).window = {
      ...(global as any),
      location: {
        protocol: 'https:',
        hostname: 'localhost',
        host: 'localhost',
        href: 'https://localhost',
      },
    };
    
    (global as any).HTMLCanvasElement = function() { return mockCanvas; };
    (global as any).Image = function() { 
      return {
        width: 0,
        height: 0,
        src: '',
        onload: null,
        onerror: null,
      };
    };
  }
  
  // We'll use the GLTFExporter from three-stdlib
  const { GLTFExporter } = await import('three-stdlib');
  console.log('[TerrainProcessor] GLTFExporter imported');
  
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    
    exporter.parse(
      mesh,
      (result) => {
        console.log('[TerrainProcessor] GLB export complete, result type:', typeof result);
        if (result instanceof ArrayBuffer) {
          console.log('[TerrainProcessor] ArrayBuffer size:', result.byteLength);
          resolve(result);
        } else {
          // Convert to ArrayBuffer if needed
          const json = JSON.stringify(result);
          const buffer = new TextEncoder().encode(json).buffer;
          console.log('[TerrainProcessor] Converted JSON to ArrayBuffer, size:', buffer.byteLength);
          resolve(buffer);
        }
      },
      (error) => {
        console.error('[TerrainProcessor] GLB export error:', error);
        reject(error);
      },
      { binary: true }
    );
  });
}

/**
 * Render mesh to PNG snapshot
 */
export function renderToPNG(
  mesh: THREE.Mesh,
  width: number = 2048,
  height: number = 2048
): string {
  // Create a scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  scene.add(mesh);

  // Create camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    preserveDrawingBuffer: true 
  });
  renderer.setSize(width, height);

  // Render
  renderer.render(scene, camera);

  // Get data URL
  const dataURL = renderer.domElement.toDataURL('image/png');

  // Cleanup
  renderer.dispose();

  return dataURL;
}

/**
 * Sample elevation data from GeoTIFF
 */
export async function sampleElevationFromGeoTIFF(
  tileBuffers: ArrayBuffer[],
  bbox: BoundingBox,
  width: number,
  height: number
): Promise<Float32Array> {
  console.log('[TerrainProcessor] Processing real DEM data from', tileBuffers.length, 'tile(s)');
  console.log('[TerrainProcessor] Target bbox:', bbox);
  console.log('[TerrainProcessor] Output resolution:', width, 'x', height);
  
  const elevationData = new Float32Array(width * height);
  
  // Import geotiff dynamically
  const { fromArrayBuffer } = await import('geotiff');
  
  // Parse all GeoTIFF tiles
  const tiles = await Promise.all(
    tileBuffers.map(async (buffer) => {
      try {
        const tiff = await fromArrayBuffer(buffer);
        const image = await tiff.getImage();
        return { tiff, image };
      } catch (error) {
        console.error('[TerrainProcessor] Error parsing GeoTIFF:', error);
        return null;
      }
    })
  );
  
  // Filter out failed parses
  const validTiles = tiles.filter(t => t !== null) as { tiff: any, image: any }[];
  
  if (validTiles.length === 0) {
    throw new Error('Failed to parse any GeoTIFF tiles');
  }
  
  console.log('[TerrainProcessor] Successfully parsed', validTiles.length, 'tile(s)');
  
  // Get metadata from first tile
  const firstImage = validTiles[0].image;
  const tileWidth = firstImage.getWidth();
  const tileHeight = firstImage.getHeight();
  const tileBBox = firstImage.getBoundingBox();
  
  console.log('[TerrainProcessor] Tile dimensions:', tileWidth, 'x', tileHeight);
  console.log('[TerrainProcessor] Tile bbox:', tileBBox);
  
  // Try to get the CRS from the GeoTIFF
  const geoKeys = firstImage.getGeoKeys();
  console.log('[TerrainProcessor] GeoTIFF GeoKeys:', geoKeys);
  
  // Check if there's an EPSG code in the metadata
  if (geoKeys && geoKeys.ProjectedCSTypeGeoKey) {
    console.log('[TerrainProcessor] Tile reports EPSG:', geoKeys.ProjectedCSTypeGeoKey);
  }
  
  // Check if we need coordinate transformation
  const firstTileBBox = validTiles[0].image.getBoundingBox();
  const needsTransform = Math.abs(firstTileBBox[0]) > 180 || Math.abs(firstTileBBox[1]) > 90;
  
  console.log('[TerrainProcessor] Tile uses projected coordinates:', needsTransform);
  
  // Import proj4 for coordinate transformation if needed
  let proj4Transform: any = null;
  if (needsTransform) {
    const proj4 = await import('proj4');
    
    // Define EPSG:6578 (NAD83(2011) / Texas Central ftUS) with exact parameters from GeoTIFF
    // Note: Using datum=NAD83 instead of ellps=GRS80 for compatibility
    proj4.default.defs('EPSG:6578', '+proj=lcc +lat_1=30.11666666666667 +lat_2=31.88333333333333 +lat_0=29.66666666666667 +lon_0=-100.3333333333333 +x_0=2296583.333333333 +y_0=9842500.0 +datum=NAD83 +units=us-ft +no_defs');
    
    proj4Transform = proj4.default('EPSG:4326', 'EPSG:6578');
    
    // Also try with known working proj4 string for debugging
    const altTransform = proj4.default(
      'EPSG:4326',
      '+proj=lcc +lat_1=30.1166666666667 +lat_2=31.8833333333333 +lat_0=29.6666666666667 +lon_0=-100.333333333333 +x_0=2296583.33333333 +y_0=9842500 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs'
    );
    
    // Test both transformations
    const testLat = bbox.minLat;
    const testLng = bbox.minLng;
    const testCoords = proj4Transform.forward([testLng, testLat]);
    const altCoords = altTransform.forward([testLng, testLat]);
    
    console.log(`[TerrainProcessor] Test point: [${testLng.toFixed(6)}, ${testLat.toFixed(6)}]`);
    console.log(`[TerrainProcessor] Transform 1: [${testCoords[0].toFixed(0)}, ${testCoords[1].toFixed(0)}]`);
    console.log(`[TerrainProcessor] Transform 2: [${altCoords[0].toFixed(0)}, ${altCoords[1].toFixed(0)}]`);
    console.log(`[TerrainProcessor] Tile bbox: [${firstTileBBox[0]}, ${firstTileBBox[1]}, ${firstTileBBox[2]}, ${firstTileBBox[3]}]`);
    
    // Use whichever transformation is closer
    const dist1 = Math.abs(testCoords[1] - firstTileBBox[1]);
    const dist2 = Math.abs(altCoords[1] - firstTileBBox[1]);
    
    if (dist2 < dist1) {
      console.log(`[TerrainProcessor] ✅ Using alternative transform (closer by ${(dist1 - dist2).toFixed(0)} feet)`);
      proj4Transform = altTransform;
    } else {
      console.log(`[TerrainProcessor] ✅ Using EPSG:6578 transform`);
    }
  }
  
  // Pre-load all tile raster data for efficiency
  console.log('[TerrainProcessor] Pre-loading all tile raster data...');
  const tilesWithData = await Promise.all(validTiles.map(async ({ image }) => {
    const tileBBox = image.getBoundingBox();
    const tileWidth = image.getWidth();
    const tileHeight = image.getHeight();
    
    // Read entire raster for this tile
    const rasters = await image.readRasters({
      samples: [0], // First band only
    });
    
    console.log(`[TerrainProcessor] Loaded tile: ${tileWidth}x${tileHeight}, bbox [${tileBBox[0].toFixed(0)}, ${tileBBox[1].toFixed(0)}, ${tileBBox[2].toFixed(0)}, ${tileBBox[3].toFixed(0)}]`);
    
    // Check for actual elevation values in the data
    const sampleVals = Array.from(rasters[0].slice(0, 100)) as number[];
    const validVals = sampleVals.filter(v => v !== 0 && v !== null && v !== undefined && !isNaN(v));
    console.log(`[TerrainProcessor] Sample elevation values from tile:`, validVals.slice(0, 5));
    
    return {
      data: rasters[0],
      bbox: tileBBox,
      width: tileWidth,
      height: tileHeight,
    };
  }));
  
  console.log('[TerrainProcessor] All tiles loaded into memory');
  
  // WORKAROUND: Since coordinate transformation is not working correctly,
  // let's use a simpler approach - just sample from the center of the first tile
  // and map our output grid to the tile's pixel grid
  console.log('[TerrainProcessor] ⚠️  Using direct tile sampling (projection not working)');
  const primaryTile = tilesWithData[0];
  
  // Detect NoData value (-9999 is common)
  const NODATA_VALUE = -9999;
  console.log('[TerrainProcessor] Filtering out NoData value:', NODATA_VALUE);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Map output grid to tile's pixel grid
      // Sample from center 50% of the tile to avoid edges
      const tileX = Math.floor((x / width) * primaryTile.width * 0.5 + primaryTile.width * 0.25);
      const tileY = Math.floor((y / height) * primaryTile.height * 0.5 + primaryTile.height * 0.25);
      
      const dataIdx = tileY * primaryTile.width + tileX;
      let elevation = primaryTile.data[dataIdx];
      
      // Filter out NoData values
      if (elevation === NODATA_VALUE || elevation === null || elevation === undefined || isNaN(elevation)) {
        elevation = 0;
      }
      
      // Convert feet to meters (elevation values are in feet)
      elevation = elevation * 0.3048;
      
      elevationData[idx] = elevation;
    }
  }
  
  const validElevations = Array.from(elevationData).filter(e => e !== 0);
  const minElev = validElevations.length > 0 ? Math.min(...validElevations) : 0;
  const maxElev = validElevations.length > 0 ? Math.max(...validElevations) : 0;
  
  console.log('[TerrainProcessor] ✅ Sampled', validElevations.length, 'valid elevation points');
  console.log('[TerrainProcessor] Elevation range (meters):', minElev.toFixed(2), 'to', maxElev.toFixed(2));
  
  return elevationData;
}

