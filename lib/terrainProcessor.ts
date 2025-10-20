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

  // Apply elevation data to vertices (Y coordinate for horizontal plane)
  let insideCount = 0;
  let outsideCount = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const vertexIndex = idx * 3;

      if (vertices[vertexIndex + 1] !== undefined) {
        let elevation = elevationData[idx] * scale.z;

        // If polygon is provided, check if this vertex is inside
        if (polygon && boundingBox) {
          // Map vertex position to lat/lng
          const normalizedX = x / (width - 1);
          const normalizedY = y / (height - 1);
          const lng = boundingBox.minLng + normalizedX * (boundingBox.maxLng - boundingBox.minLng);
          const lat = boundingBox.minLat + normalizedY * (boundingBox.maxLat - boundingBox.minLat);
          
          const point = turf.point([lng, lat]);
          const isInside = turf.booleanPointInPolygon(point, polygon);
          
          // If outside polygon, set elevation to 0 (base level)
          if (!isInside) {
            elevation = 0;
            outsideCount++;
          } else {
            insideCount++;
          }
        }

        vertices[vertexIndex + 1] = elevation;
      }
    }
  }
  
  if (polygon) {
    console.log(`[TerrainProcessor] Vertices inside polygon: ${insideCount}, outside: ${outsideCount}`);
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x88cc88,
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
  data: ArrayBuffer,
  bbox: BoundingBox,
  width: number,
  height: number
): Promise<Float32Array> {
  // This would use the geotiff library to read and sample the data
  // For now, return a placeholder with more realistic terrain
  const elevationData = new Float32Array(width * height);
  
  // Generate realistic-looking terrain for testing
  // Combine multiple sine waves at different frequencies for natural look
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      // Combine multiple frequencies for more natural terrain
      const freq1 = Math.sin(x / 20) * Math.cos(y / 20) * 2;
      const freq2 = Math.sin(x / 10) * Math.cos(y / 10) * 1;
      const freq3 = Math.sin(x / 5) * Math.cos(y / 5) * 0.5;
      
      // Add gentle slope
      const slope = (x / width) * 0.5;
      
      // Combine all for natural-looking terrain (values 0-4)
      elevationData[idx] = freq1 + freq2 + freq3 + slope + 1;
    }
  }
  
  return elevationData;
}

