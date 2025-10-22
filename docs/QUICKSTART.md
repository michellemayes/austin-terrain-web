# Quick Start Guide

Get the Austin 3D Terrain Generator running locally in under 5 minutes!

## New Features ✨

- **Responsive Navigation** - Easy access to Generator and Documentation pages
- **3D Viewer Controls** - Fullscreen mode and rotation toggle
- **Optimized WMS** - Better aerial imagery retrieval
- **No Area Limit** - Create large terrain models
- **In-App Documentation** - Visit `/docs` for detailed information

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager

## Installation

```bash
# Navigate to the project directory
cd austin-terrain-web

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## First Time Usage

1. **Open your browser** to http://localhost:3000

2. **Navigation** - You'll see a navigation bar at the top:
   - **Generator** - Main terrain generation tool (home page)
   - **Documentation** - Detailed info about data sources and how it works
   - **GitHub** - Link to repository
   - On mobile: Click hamburger menu (☰) to access

3. **Select an area** using one of two methods:
   
   **Option A: Draw on Map**
   - Click the "Draw on Map" tab (default)
   - Click the polygon or rectangle tool in the map toolbar
   - Draw your area of interest on the map
   - The area will be validated automatically
   
   **Option B: Enter Coordinates**
   - Click the "Enter Coordinates" tab
   - Input lat/long coordinates (one per line)
   - Format: `30.2672, -97.7431`
   - Click "Submit Coordinates"

3. **Generate Terrain**
   - Click the "Generate 3D Terrain" button
   - Wait for processing (progress bar will show status)
   - Processing time: 30 seconds to 2 minutes depending on area size

4. **View in 3D**
   - Use the interactive viewer controls:
     - **⏸️ Pause / ▶️ Rotate** - Toggle auto-rotation
     - **⤢ Fullscreen** - Enter fullscreen mode
     - **Mouse drag** - Rotate view
     - **Scroll** - Zoom in/out
   - The terrain shows real aerial imagery as a texture

5. **Download Files**
   - Download your preferred format:
     - PNG: High-resolution snapshot
     - GLB: Interactive 3D model
     - STL: 3D printable file

## Example Coordinates

Try these sample areas in Austin:

### Zilker Park
```
30.2672, -97.7431
30.2680, -97.7431
30.2680, -97.7420
30.2672, -97.7420
```

### Texas State Capitol
```
30.2747, -97.7403
30.2755, -97.7403
30.2755, -97.7390
30.2747, -97.7390
```

### Mount Bonnell
```
30.3164, -97.7721
30.3172, -97.7721
30.3172, -97.7710
30.3164, -97.7710
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Map Not Loading

If the Leaflet map doesn't load:
1. Check browser console for errors
2. Ensure you have an internet connection (for base map tiles)
3. Clear browser cache and refresh

### Build Errors

```bash
# Type check
npx tsc --noEmit

# Check linting
npm run lint
```

## Development Tips

### Hot Reload

The development server supports hot reload - changes to files will automatically refresh the browser.

### Component Development

Individual components can be tested by importing them into `app/page.tsx`:

```typescript
import MapSelector from '@/components/MapSelector';
```

### API Testing

Test the API endpoint directly:

```bash
# POST request to generate terrain
curl -X POST http://localhost:3000/api/generate-terrain \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": [
      {"lat": 30.2672, "lng": -97.7431},
      {"lat": 30.2680, "lng": -97.7431},
      {"lat": 30.2680, "lng": -97.7420},
      {"lat": 30.2672, "lng": -97.7420}
    ],
    "boundingBox": {
      "minLat": 30.2672,
      "maxLat": 30.2680,
      "minLng": -97.7431,
      "maxLng": -97.7420
    },
    "areaAcres": 0.5
  }'

# GET request to check job status
curl http://localhost:3000/api/generate-terrain?jobId=YOUR_JOB_ID
```

### Viewing Generated Files

Generated terrain files are stored in:
```
public/terrain/{jobId}/
├── snapshot.png
├── terrain.glb
└── terrain.stl
```

Access them at:
```
http://localhost:3000/terrain/{jobId}/snapshot.png
```

## Next Steps

- Read [README.md](./README.md) for full feature documentation
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) before deploying

## Common Issues

### Area Size Considerations

While there's no strict area limit (set to 1000 acres):
- Larger areas take longer to process (30+ seconds)
- Very large areas may require more memory
- Try starting with smaller areas for faster results

### "Selected area must be within the Austin region"

Your coordinates are outside the Austin area bounds:
- Latitude: 30.0°N to 30.6°N
- Longitude: -98.2°W to -97.5°W

Adjust your selection to be within these bounds.

### Generation Takes Too Long

If terrain generation exceeds expected time:
1. Check the browser console for errors
2. Look at terminal logs for server errors
3. Try a smaller area
4. Restart the development server

### Memory Issues

If you encounter out-of-memory errors:
1. Reduce the output resolution in `lib/terrainProcessor.ts`
2. Close other applications
3. Increase Node.js memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```

## Getting Help

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Review browser console for frontend errors
- Check terminal output for backend errors
- File issues on GitHub (if applicable)

## What's Working / What's Not

### ✅ Currently Working
- Interactive map with polygon drawing (polygons persist!)
- Coordinate input form
- Area validation (Austin bounds, no size limit)
- **Real aerial imagery from TNRIS WMS** ✅
- **Real elevation data from TNRIS DEM tiles** ✅
- **Optimized WMS bbox calculation** ✅
- 3D mesh generation with polygon masking
- **Texture mapping (real imagery on terrain)** ✅
- **Accurate LiDAR elevation (28cm-50cm resolution)** ✅
- PNG snapshot export (aerial imagery)
- GLB model export (with texture and terrain)
- STL file export (3D printable)
- **Interactive 3D viewer with:**
  - Fullscreen mode ✅
  - Auto-rotation toggle ✅
  - Orbital controls ✅
- Progress tracking UI
- **Responsive navigation menu** ✅
- **Documentation page at `/docs`** ✅

### ✅ Real Data Integration
- **DEM elevation**: Uses real TNRIS LiDAR data
  - GeoTIFF tiles from S3
  - Travis County coverage
  - Accurate terrain representation
  - Tile mosaicking for multi-tile areas
- **Everything is real and working!**

### 🔧 Optional Infrastructure Enhancements
- Job persistence (Redis/database)
- External file storage (S3, Vercel Blob) for scalability
- Automated file cleanup
- Rate limiting
- Error monitoring (Sentry)
- Expanded DEM coverage beyond Travis County

The application is production-ready with complete real data integration!

