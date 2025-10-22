# Technical Architecture

## System Overview

The Austin 3D Terrain Generator is a full-stack Next.js application that transforms geospatial data into downloadable 3D models. It combines high-resolution aerial imagery with LiDAR elevation data to create realistic terrain representations.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ MapSelector  │  │CoordinateForm│  │  TerrainViewer   │   │
│  │  (Leaflet)   │  │              │  │(React 3 Fiber)   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (Node.js)               │
│              /api/generate-terrain (POST/GET)               │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌──────────────────┐  ┌─────────┐  ┌──────────────────┐
│  TNRIS WMS       │  │  S3 DEM │  │  Three.js        │
│  Imagery Server  │  │  Tiles  │  │  Processing      │
└──────────────────┘  └─────────┘  └──────────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                   ┌─────────────────┐
                   │ File Generation │
                   │ PNG/GLB/STL     │
                   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │ /public/terrain │
                   │ (Static Files)  │
                   └─────────────────┘
```

## Data Flow

### 1. User Input Phase

**Map Selection (MapSelector.tsx)**
- User draws polygon or rectangle on Leaflet map
- leaflet-draw provides drawing tools
- Real-time area calculation using Turf.js
- Validation against 10-acre limit and Austin boundaries

**Coordinate Input (CoordinateForm.tsx)**
- Alternative input method via text form
- Parse lat/long coordinates
- Same validation as map selection

### 2. API Request Phase

**POST /api/generate-terrain**

```typescript
Request Body:
{
  coordinates: Coordinate[],    // Array of {lat, lng}
  boundingBox: BoundingBox,     // {minLat, maxLat, minLng, maxLng}
  areaAcres: number             // Calculated area
}

Response:
{
  jobId: string,                // UUID for tracking
  status: 'processing'
}
```

### 3. Server-Side Processing Phase

**Step 1: Fetch Aerial Imagery**
```typescript
// lib/dataFetcher.ts
fetchImageryFromWMS(bbox, width, height)
```
- Constructs WMS GetMap request
- Parameters: EPSG:4326 projection, PNG format
- Returns: Image blob

**Step 2: Fetch Elevation Data**
```typescript
// lib/dataFetcher.ts
fetchDEMData(bbox)
```
- Identify required DEM tiles from TNRIS S3
- Download GeoTIFF tiles for the area
- Mosaic tiles if area spans multiple tiles
- Crop to bounding box
- Returns: GeoTIFF ArrayBuffer

**Step 3: Process Elevation Data**
```typescript
// lib/terrainProcessor.ts
sampleElevationFromGeoTIFF(data, bbox, width, height)
```
- Parse GeoTIFF using geotiff library
- Resample to desired resolution
- Returns: Float32Array of elevation values

**Step 4: Generate 3D Mesh**
```typescript
generateTerrainMesh(elevationData, width, height, scale)
```
- Create THREE.PlaneGeometry with grid
- Apply elevation to Z coordinates
- Compute vertex normals for lighting
- Returns: THREE.Mesh

**Step 5: Apply Texture**
```typescript
applyTextureToMesh(mesh, texture)
```
- Convert imagery blob to THREE.Texture
- Map texture to mesh UVs
- Update material

**Step 6: Export Formats**

*PNG Snapshot*
```typescript
renderToPNG(mesh, width, height)
```
- Create offscreen scene with mesh
- Add lighting and camera
- Render using THREE.WebGLRenderer
- Extract as PNG data URL
- Save to disk

*GLB Model*
```typescript
exportToGLB(mesh)
```
- Use GLTFExporter from three-stdlib
- Binary GLTF format (.glb)
- Includes geometry, materials, and textures
- Optimized for web viewing

*STL File*
```typescript
exportToSTL(mesh, includeBase=true)
```
- Convert mesh to ASCII STL format
- Optionally add base/walls for 3D printing
- Ensure manifold geometry
- Save as .stl file

### 4. File Storage

Generated files are stored in:
```
/public/terrain/{jobId}/
├── snapshot.png
├── terrain.glb
└── terrain.stl
```

Public URLs:
```
https://your-domain.com/terrain/{jobId}/snapshot.png
https://your-domain.com/terrain/{jobId}/terrain.glb
https://your-domain.com/terrain/{jobId}/terrain.stl
```

### 5. Status Polling

**GET /api/generate-terrain?jobId={id}**

```typescript
Response:
{
  jobId: string,
  status: 'processing' | 'completed' | 'error',
  progress: number,        // 0-100
  message?: string,        // Status message
  files?: {
    png: string,
    glb: string,
    stl: string
  },
  error?: string
}
```

Frontend polls every 2 seconds until status is 'completed' or 'error'.

## Key Technologies

### Frontend

**Leaflet** (leaflet, react-leaflet, leaflet-draw)
- Interactive map interface
- Drawing tools for area selection
- Customizable controls and overlays

**React Three Fiber** (@react-three/fiber, @react-three/drei)
- Declarative Three.js in React
- 3D terrain preview
- Camera controls and lighting

**Turf.js** (@turf/turf)
- Geospatial calculations
- Area measurement
- Coordinate transformations

### Backend

**Three.js** (three, three-stdlib)
- 3D geometry generation
- Texture mapping
- Mesh export (STL, GLB)
- Rendering engine

**GeoTIFF** (geotiff)
- Parse elevation raster data
- Coordinate transformations
- Data sampling

**Proj4** (proj4)
- Coordinate system transformations
- WGS84 ↔ UTM conversions

## Data Sources

### TNRIS WMS Imagery

**Endpoint**: 
```
https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer
```

**Specifications**:
- Service: WMS 1.3.0
- CRS: EPSG:4326 (WGS84)
- Format: PNG
- Resolution: Variable (typically 12-inch)

**Example Request**:
```
?SERVICE=WMS
&VERSION=1.3.0
&REQUEST=GetMap
&LAYERS=0
&CRS=EPSG:4326
&BBOX=30.2672,-97.7431,30.2680,-97.7420
&WIDTH=2048
&HEIGHT=2048
&FORMAT=image/png
```

### TNRIS DEM Data

**Location**: 
```
https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/
```

**Specifications**:
- Format: GeoTIFF
- Resolution: 28cm-50cm
- Vertical accuracy: ~15cm
- Coverage: Bexar and Travis counties

**Tile Naming**: (needs investigation)
```
stratmap21_28cm_50cm_bexar_travis_3097_XXXXX_dem.tif
```

## Performance Considerations

### Frontend Optimization

1. **Dynamic Imports**: Map and 3D viewer loaded dynamically to avoid SSR issues
2. **Code Splitting**: React Three Fiber loaded on-demand
3. **Lazy Loading**: Components loaded as needed

### Backend Optimization

1. **Resolution Management**: 
   - Default: 128x128 for elevation, 1024x1024 for imagery
   - Adjustable based on area size and performance needs

2. **Memory Management**:
   - Stream large files instead of loading entirely into memory
   - Dispose of Three.js objects after export
   - Clear texture caches

3. **Concurrent Processing**:
   - Fetch imagery and DEM in parallel
   - Generate multiple export formats concurrently

### Serverless Function Limits

**Vercel Free Tier**:
- Max duration: 10s (insufficient for this use case)
- Memory: 1024 MB

**Vercel Pro**:
- Max duration: 300s (configured in vercel.json)
- Memory: 1024 MB (can upgrade to 3008 MB)

## Error Handling

### Frontend Errors

- Invalid coordinates → Show error message
- Area too large → Prevent submission
- Network errors → Retry with exponential backoff
- Timeout → Show timeout message with retry option

### Backend Errors

- WMS unavailable → Fallback or error message
- DEM tile not found → Try alternative or synthetic data
- Out of memory → Reduce resolution automatically
- Timeout → Cancel job and notify user

## Security Considerations

1. **Input Validation**:
   - Validate coordinate bounds
   - Limit area size
   - Sanitize file names

2. **Rate Limiting**:
   - Implement per-IP rate limits
   - Prevent abuse of generation API

3. **File Access**:
   - Use UUID job IDs (non-guessable)
   - Set expiration on generated files
   - Regular cleanup of old files

4. **CORS**:
   - Configure WMS server CORS properly
   - Restrict API access if needed

## Future Improvements

### Performance
- [ ] Implement Redis for job queue
- [ ] Add WebWorker for client-side processing
- [ ] Cache frequently requested areas
- [ ] Progressive streaming of results

### Features
- [x] Real-time DEM tile fetching from S3 ✅
- [ ] Custom resolution selection
- [ ] Vertical exaggeration control
- [ ] Time-series comparison
- [ ] Batch processing
- [ ] Expanded DEM coverage beyond Travis County

### Infrastructure
- [ ] Migrate to dedicated servers for heavy processing
- [ ] Implement CDN for static files
- [ ] Add job queue system (Bull, BullMQ)
- [ ] Database for persistent job storage
- [ ] Automatic cleanup cron jobs

### Monitoring
- [ ] Add application performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Usage analytics
- [ ] Cost monitoring

## Development Workflow

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
npm run build

# Linting
npm run lint

# Production build
npm run build && npm start
```

## Testing Strategy

### Unit Tests (TODO)
- Geospatial calculation functions
- Coordinate validation
- Area calculations

### Integration Tests (TODO)
- WMS API calls
- File generation pipeline
- API endpoints

### E2E Tests (TODO)
- Complete user flow
- File download verification
- Error scenarios

## Contributing

When adding new features:
1. Follow TypeScript strict mode
2. Add proper error handling
3. Update this architecture document
4. Consider performance implications
5. Test with various area sizes

