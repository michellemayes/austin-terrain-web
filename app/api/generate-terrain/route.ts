import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { TerrainRequest, TerrainJobStatus } from '@/types';
import { calculateBoundingBox } from '@/lib/geoUtils';
import { fetchImageryFromWMS } from '@/lib/dataFetcher';
import * as THREE from 'three';
import { 
  generateTerrainMesh, 
  exportToSTL, 
  exportToGLB, 
  sampleElevationFromGeoTIFF 
} from '@/lib/terrainProcessor';
import fs from 'fs';
import path from 'path';

// In-memory job storage (in production, use Redis or database)
const jobs = new Map<string, TerrainJobStatus>();

// S3 DEM data location
const S3_DEM_BASE = 'https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/';

export async function POST(request: NextRequest) {
  try {
    const body: TerrainRequest = await request.json();
    const { coordinates, areaAcres } = body;

    // Validate input
    if (!coordinates || coordinates.length < 3) {
      return NextResponse.json(
        { error: 'At least 3 coordinates required' },
        { status: 400 }
      );
    }

    if (areaAcres > 1000) {
      return NextResponse.json(
        { error: 'Area exceeds maximum of 1000 acres' },
        { status: 400 }
      );
    }

    // Generate job ID
    const jobId = uuidv4();

    // Initialize job status
    const jobStatus: TerrainJobStatus = {
      jobId,
      status: 'processing',
      progress: 0,
      message: 'Starting terrain generation...',
    };
    jobs.set(jobId, jobStatus);

    // Start processing in the background (don't await)
    processTerrainGeneration(jobId, coordinates).catch((error) => {
      console.error('Error processing terrain:', error);
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'error';
        job.error = error.message;
        jobs.set(jobId, job);
      }
    });

    // Return job ID immediately
    return NextResponse.json({ jobId, status: 'processing' });
  } catch (error) {
    console.error('Error in generate-terrain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID required' },
      { status: 400 }
    );
  }

  const job = jobs.get(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}

async function processTerrainGeneration(
  jobId: string,
  coordinates: { lat: number; lng: number }[]
) {
  const updateProgress = (progress: number, message: string) => {
    const job = jobs.get(jobId);
    if (job) {
      job.progress = progress;
      job.message = message;
      jobs.set(jobId, job);
    }
  };

  try {
    // Calculate bounding box
    updateProgress(10, 'Calculating area...');
    const bbox = calculateBoundingBox(coordinates);

    // Fetch imagery from WMS
    updateProgress(20, 'Getting imagery...');
    const imageryBlob = await fetchImageryFromWMS(bbox, 1024, 1024);
    const imageryBuffer = await imageryBlob.arrayBuffer();

    // For DEM data, we'll use placeholder data for now
    // In production, this would fetch and process actual DEM tiles from S3
    updateProgress(40, 'Getting DEM data...');
    console.log('[API] ═══════════════════════════════════════════════════════');
    console.log('[API] DEM DATA PLACEHOLDER - NOT FROM S3 YET');
    console.log('[API] ═══════════════════════════════════════════════════════');
    console.log('[API] Real implementation would:');
    console.log('[API]   1. Query S3 bucket for available DEM tiles');
    console.log('[API]   2. Identify which tiles cover bbox:', bbox);
    console.log('[API]   3. Download tiles from:', S3_DEM_BASE);
    console.log('[API]   4. Parse GeoTIFF elevation data');
    console.log('[API]   5. Mosaic and crop to exact area');
    console.log('[API] ═══════════════════════════════════════════════════════');
    console.log('[API] Currently generating SYNTHETIC test elevation data...');
    
    const width = 128;
    const height = 128;
    const elevationData = await sampleElevationFromGeoTIFF(
      new ArrayBuffer(0), // Placeholder - no real data
      bbox,
      width,
      height
    );
    
    console.log('[API] Test elevation data generated:', width, 'x', height, 'vertices');

    // Generate 3D mesh
    updateProgress(60, 'Building 3D mesh...');
    const mesh = generateTerrainMesh(
      elevationData, 
      width, 
      height, 
      {
        x: 1,
        y: 1,
        z: 5, // Increased to make subtle elevation visible
      },
      coordinates, // Pass polygon coordinates
      bbox // Pass bounding box
    );

    // Create output directory
    updateProgress(70, 'Preparing files...');
    const outputDir = path.join(process.cwd(), 'public', 'terrain', jobId);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save the aerial imagery as the snapshot PNG
    updateProgress(75, 'Saving imagery...');
    const imageryBufferData = Buffer.from(imageryBuffer);
    fs.writeFileSync(path.join(outputDir, 'snapshot.png'), imageryBufferData);
    fs.writeFileSync(path.join(outputDir, 'texture.png'), imageryBufferData);
    console.log('[API] Saved texture.png:', imageryBufferData.length, 'bytes to', path.join(outputDir, 'texture.png'));

    // Apply texture to mesh
    updateProgress(80, 'Applying texture...');
    console.log('[API] Starting texture application...');
    console.log('[API] Imagery buffer size:', imageryBuffer.byteLength, 'bytes');
    
    // Update mesh material with texture reference
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      console.log('[API] Mesh material is MeshStandardMaterial, proceeding...');
      
      try {
        console.log('[API] Attempting to load canvas module...');
        const canvas = require('canvas');
        const { createCanvas, loadImage } = canvas;
        console.log('[API] Canvas module loaded successfully');
        
        console.log('[API] Loading image from buffer...');
        const img = await loadImage(Buffer.from(imageryBuffer));
        console.log('[API] Image loaded:', img.width, 'x', img.height);
        
        const canvasEl = createCanvas(img.width, img.height);
        const ctx = canvasEl.getContext('2d');
        ctx.drawImage(img, 0, 0);
        console.log('[API] Image drawn to canvas');
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        console.log('[API] Image data extracted:', imageData.data.length, 'bytes');
        
        const dataTexture = new THREE.DataTexture(
          imageData.data,
          img.width,
          img.height,
          THREE.RGBAFormat
        );
        dataTexture.needsUpdate = true;
        console.log('[API] DataTexture created');
        
        mesh.material.map = dataTexture;
        mesh.material.needsUpdate = true;
        console.log('[API] ✅ Texture applied to mesh successfully!');
      } catch (err) {
        console.error('[API] Error applying texture:', err);
        console.error('[API] Error details:', (err as Error).message);
        console.warn('[API] Will export without texture');
      }
    } else {
      console.warn('[API] Mesh material is not MeshStandardMaterial, cannot apply texture');
    }

    // Remove texture before export (it will be applied separately in the viewer)
    const originalTexture = mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material.map : null;
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      console.log('[API] Removing texture from mesh before GLB export (will be applied in viewer)');
      mesh.material.map = null;
      mesh.material.needsUpdate = true;
    }
    
    // Generate GLB file
    updateProgress(85, 'Exporting GLB...');
    const glbBuffer = await exportToGLB(mesh);
    fs.writeFileSync(path.join(outputDir, 'terrain.glb'), Buffer.from(glbBuffer));
    
    // Restore texture for STL export if needed
    if (originalTexture && mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.map = originalTexture;
      mesh.material.needsUpdate = true;
    }

    // Generate STL file (with base)
    updateProgress(90, 'Exporting STL...');
    const stlData = exportToSTL(mesh, true);
    fs.writeFileSync(path.join(outputDir, 'terrain.stl'), stlData);

    // Update job status with file URLs
    updateProgress(100, 'Complete!');
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.files = {
        png: `/terrain/${jobId}/snapshot.png`,
        glb: `/terrain/${jobId}/terrain.glb`,
        stl: `/terrain/${jobId}/terrain.stl`,
      };
      jobs.set(jobId, job);
    }
  } catch (error) {
    console.error('Error processing terrain:', error);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      jobs.set(jobId, job);
    }
  }
}

