# Austin 3D Terrain Generator

A Next.js web application that generates downloadable 3D terrain models from Austin-area aerial imagery and elevation data.

## Features

- **Interactive Map Selection**: Draw polygons or rectangles on a map to select your area of interest
- **Coordinate Input**: Alternatively, enter lat/long coordinates directly
- **Area Validation**: Automatically validates that selected areas are within Austin and under 10 acres
- **High-Resolution Data**: Uses TNRIS StratMap imagery and LiDAR elevation data
- **Multiple Export Formats**:
  - PNG: High-resolution rendered snapshot
  - GLB: Interactive 3D model for web viewers
  - STL: 3D-printable file with base
- **Real-time Progress**: Live progress updates during terrain generation
- **3D Preview**: Interactive preview of generated terrain before download

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Mapping**: Leaflet with leaflet-draw
- **3D Rendering**: Three.js with React Three Fiber
- **Geospatial**: Turf.js, proj4, geotiff
- **Deployment**: Optimized for Vercel

## Data Sources

- **Aerial Imagery**: [TNRIS StratMap WMS Server](https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer)
- **Elevation Data**: [TNRIS DEM Collection](https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/index.html?prefix=LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/)

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

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment on Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

### Important Notes for Deployment

- The terrain generation API route processes data server-side
- For large areas or high-resolution outputs, consider upgrading to Vercel Pro for extended function timeout (300s)
- Generated files are stored in `/public/terrain` - consider adding a cleanup cron job for production

## Usage

1. **Select Area**: 
   - Use the "Draw on Map" tab to draw a polygon on the interactive map, OR
   - Use the "Enter Coordinates" tab to input lat/long coordinates

2. **Validate**: 
   - The application automatically validates that your area is within Austin
   - Maximum area allowed is 10 acres

3. **Generate**: 
   - Click "Generate 3D Terrain" to start processing
   - Monitor progress with the real-time status indicator

4. **Download**: 
   - Once complete, preview the 3D model
   - Download in your preferred format (PNG, GLB, or STL)

## Project Structure

```
austin-terrain-web/
├── app/
│   ├── api/
│   │   └── generate-terrain/
│   │       └── route.ts          # Terrain generation API
│   ├── layout.tsx
│   ├── page.tsx                  # Main page
│   └── globals.css
├── components/
│   ├── CoordinateForm.tsx        # Coordinate input form
│   ├── MapSelector.tsx           # Interactive map with drawing
│   ├── TerrainProgress.tsx       # Progress indicator
│   └── TerrainViewer.tsx         # 3D viewer component
├── lib/
│   ├── dataFetcher.ts            # WMS/S3 data fetching utilities
│   ├── geoUtils.ts               # Geospatial calculations
│   └── terrainProcessor.ts       # 3D mesh generation and export
├── types/
│   └── index.ts                  # TypeScript type definitions
└── public/
    └── terrain/                  # Generated terrain files
```

## Future Enhancements

- [ ] Implement proper DEM tile indexing and fetching from S3
- [ ] Add user authentication and saved terrain history
- [ ] Implement server-side caching for frequently requested areas
- [ ] Add more customization options (resolution, vertical exaggeration, etc.)
- [ ] Support for larger areas (with appropriate processing time warnings)
- [ ] Add comparison view to overlay multiple time periods
- [ ] Integrate additional data layers (land use, vegetation, etc.)

## License

MIT

## Credits

- Elevation data: Texas Natural Resources Information System (TNRIS)
- Aerial imagery: CAPCOG StratMap program
- Inspired by the original R script using rayshader
