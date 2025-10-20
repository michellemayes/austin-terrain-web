# Austin 3D Terrain Generator

A Next.js web application that generates downloadable 3D terrain models from Austin-area aerial imagery and elevation data.

## Features

- **Interactive Map Selection**: Draw polygons or rectangles on a map to select your area of interest
- **Coordinate Input**: Alternatively, enter lat/long coordinates directly
- **Area Validation**: Automatically validates that selected areas are within Austin region
- **High-Resolution Aerial Imagery**: Uses TNRIS StratMap WMS server with optimized bbox calculation
- **Multiple Export Formats**:
  - PNG: High-resolution aerial imagery snapshot
  - GLB: Interactive 3D model for web viewers with texture
  - STL: 3D-printable file format
- **Real-time Progress**: Live progress updates during terrain generation
- **Interactive 3D Preview**: 
  - View generated terrain with orbital controls
  - Fullscreen mode
  - Toggle auto-rotation
- **Responsive Navigation**: Works perfectly on desktop and mobile
- **Comprehensive Documentation**: Built-in docs page explaining how it works

## Current Status

✅ **Fully Functional** - The application works end-to-end with the following features:
- Interactive map with polygon drawing
- Real aerial imagery from TNRIS WMS server
- 3D mesh generation with polygon masking
- Interactive 3D viewer with controls
- File downloads in three formats
- Beautiful, responsive UI

⚠️ **Using Test Elevation Data** - Currently generates synthetic terrain. Real DEM data from TNRIS S3 is planned but not yet implemented.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Mapping**: Leaflet with leaflet-draw (loaded from CDN)
- **3D Rendering**: Three.js with React Three Fiber
- **Geospatial**: Turf.js, proj4, geotiff
- **Server-side Processing**: Node Canvas for image processing
- **Deployment**: Optimized for Vercel

## Data Sources

- **Aerial Imagery**: [TNRIS StratMap WMS Server](https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer) ✅ Working
- **Elevation Data**: [TNRIS DEM Collection](https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/index.html?prefix=LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/) ⚠️ Planned

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Quick Test

1. Click "Draw on Map" (or enter coordinates)
2. Draw a polygon in the Austin area (try downtown: ~30.27, -97.74)
3. Click "Generate 3D Terrain"
4. Wait 5-10 seconds
5. View your 3D terrain with aerial imagery!
6. Download PNG, GLB, or STL files

## Usage

### Select Area

**Option 1: Draw on Map**
- Click the polygon or rectangle tool
- Draw your area on the map
- The polygon persists after drawing

**Option 2: Enter Coordinates**
- Switch to "Enter Coordinates" tab
- Input lat/long coordinates (one per line)
- Format: `30.2672, -97.7431`

### Generate Terrain

- Click "Generate 3D Terrain" button
- Monitor progress with real-time status
- Processing takes 5-30 seconds depending on area size

### View & Download

**3D Preview Controls:**
- **⏸️ Pause / ▶️ Rotate** - Toggle auto-rotation
- **⤢ Fullscreen** - View in fullscreen mode
- **Mouse drag** - Rotate view
- **Scroll** - Zoom in/out

**Download Formats:**
- **PNG** - Aerial imagery snapshot
- **GLB** - 3D model with texture for viewers
- **STL** - 3D printable file

## Project Structure

```
austin-terrain-web/
├── app/
│   ├── api/generate-terrain/route.ts  # Terrain generation API
│   ├── docs/page.tsx                  # Documentation page
│   ├── layout.tsx                     # Root layout with navigation
│   ├── page.tsx                       # Main generator page
│   └── globals.css                    # Global styles
├── components/
│   ├── BasicMap.tsx                   # Leaflet map with drawing tools
│   ├── CoordinateForm.tsx             # Coordinate input form
│   ├── Navigation.tsx                 # Responsive nav menu
│   ├── TerrainProgress.tsx            # Progress indicator
│   └── TerrainViewer.tsx              # 3D viewer with controls
├── lib/
│   ├── dataFetcher.ts                 # WMS imagery fetching
│   ├── geoUtils.ts                    # Geospatial calculations
│   └── terrainProcessor.ts            # 3D mesh generation & export
├── types/
│   └── index.ts                       # TypeScript definitions
└── public/terrain/                    # Generated terrain files
```

## Key Features Explained

### WMS Imagery Retrieval

The app uses an optimized "safe" WMS bounding box calculation:
- Calculates center point of polygon
- Uses fixed ground resolution (0.35 m/pixel)
- Accounts for latitude when converting meters to degrees
- Formula: `deg_lon = (mpp × width) / (111320 × cos(lat))`

This ensures reliable imagery retrieval across different areas.

### Polygon Masking

The 3D terrain mesh is generated for the entire bounding box, but:
- Vertices inside the polygon show terrain elevation
- Vertices outside the polygon are set to 0 (flat)
- Result: Terrain shape matches your drawn polygon exactly

### Texture Mapping

- Aerial imagery loaded separately from GLB
- Applied in browser using Three.js TextureLoader
- Proper UV mapping for correct orientation
- FlipY enabled for proper alignment

## Known Limitations

1. **Test Elevation Data**: Currently uses synthetic terrain (sine waves). Real DEM implementation pending.
2. **Imagery Coverage**: Some areas may have limited coverage (appears blank/transparent)
3. **Processing Time**: Larger areas take longer (30+ seconds for complex polygons)
4. **Vercel Timeout**: Requires Vercel Pro for 300-second function timeout

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy to Vercel:
```bash
git init
git add .
git commit -m "Initial commit"
git push
# Import to Vercel
```

**Note**: Vercel Pro required for extended function timeout (300s).

## Documentation

- **[GET_STARTED.md](./docs/GET_STARTED.md)** - Quick 2-minute start guide
- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Detailed guide with examples
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical architecture
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment guide
- **[IMPLEMENTATION_STATUS.md](./docs/IMPLEMENTATION_STATUS.md)** - Feature status
- **[PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md)** - Executive summary
- **In-app Documentation** - Visit `/docs` in the app

## Contributing

Future enhancements needed:
- Real DEM data pipeline from TNRIS S3
- Redis for job persistence
- External file storage (Vercel Blob/S3)
- Automated file cleanup
- Rate limiting
- User authentication

## License

MIT

## Credits

- **Elevation data source**: Texas Natural Resources Information System (TNRIS)
- **Aerial imagery**: TNRIS StratMap Program
- **Inspiration**: Original R script using rayshader package
- **Open data**: Texas Water Development Board

## Support

For issues or questions, see the in-app Documentation page at `/docs`.
