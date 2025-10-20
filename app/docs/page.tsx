export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Documentation</h1>
          <p className="text-xl text-gray-700">
            Learn how the Austin 3D Terrain Generator works and the data sources behind it.
          </p>
        </div>

        {/* Overview */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Overview</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            This application generates downloadable 3D terrain models from high-resolution geospatial data 
            for areas within the Austin, Texas region. It combines aerial imagery with elevation data to create 
            realistic 3D representations that can be viewed interactively, downloaded as images, or 3D printed.
          </p>
        </section>

        {/* How It Works */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How It Works</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">1. Area Selection</h3>
              <p className="text-gray-700 leading-relaxed">
                Users can define their area of interest by either drawing a polygon on an interactive Leaflet map 
                or entering latitude/longitude coordinates manually. The application validates that the selected 
                area is within the Austin region bounds.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">2. Aerial Imagery Fetching</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                High-resolution aerial imagery is fetched from the TNRIS (Texas Natural Resources Information System) 
                StratMap WMS server. The system calculates a "safe" WMS bounding box using a fixed ground resolution 
                of 0.35 meters per pixel, ensuring reliable imagery retrieval.
              </p>
              <p className="text-sm text-gray-600 italic">
                Source: <a href="https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer" 
                className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  TNRIS StratMap21 NC-CIR CapArea Brazos Kerr ImageServer
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">3. Elevation Data (Test Mode)</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">⚠️ Current Status: Test Data</p>
                <p className="text-sm text-yellow-700">
                  The application currently uses synthetic elevation data (procedurally generated terrain). 
                  Real DEM (Digital Elevation Model) data from TNRIS is not yet implemented.
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-2">
                When fully implemented, the system will fetch LiDAR elevation data from TNRIS S3 storage, 
                parse GeoTIFF files, and create accurate terrain meshes matching the actual landscape.
              </p>
              <p className="text-sm text-gray-600 italic">
                Planned Source: <a href="https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/index.html?prefix=LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/" 
                className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  TNRIS StratMap21 28cm-50cm Bexar-Travis DEM Collection
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">4. 3D Mesh Generation</h3>
              <p className="text-gray-700 leading-relaxed">
                The application creates a 3D terrain mesh using Three.js, applying elevation data to vertices 
                and masking the mesh to match the user's selected polygon shape. The aerial imagery is applied 
                as a texture with proper UV mapping.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">5. Export Formats</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                The generated terrain is exported in three formats:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><strong>PNG:</strong> High-resolution rendered snapshot of the aerial imagery</li>
                <li><strong>GLB:</strong> Binary GLTF format for interactive 3D viewing in web browsers and other applications</li>
                <li><strong>STL:</strong> 3D printable file format with optional base for physical models</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Technology Stack</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Frontend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">▸</span>
                  <div>
                    <strong>Next.js 15</strong> - React framework
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">▸</span>
                  <div>
                    <strong>Leaflet</strong> - Interactive mapping
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">▸</span>
                  <div>
                    <strong>React Three Fiber</strong> - 3D visualization
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">▸</span>
                  <div>
                    <strong>Tailwind CSS</strong> - Styling
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Backend</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">▸</span>
                  <div>
                    <strong>Next.js API Routes</strong> - Server-side processing
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">▸</span>
                  <div>
                    <strong>Three.js</strong> - 3D mesh generation
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">▸</span>
                  <div>
                    <strong>Turf.js</strong> - Geospatial calculations
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">▸</span>
                  <div>
                    <strong>Canvas (node-canvas)</strong> - Image processing
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Sources</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aerial Imagery</h3>
              <p className="text-gray-700 mb-2">
                <strong>Provider:</strong> Texas Natural Resources Information System (TNRIS)
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Dataset:</strong> StratMap 2021 Near Color Infrared (NC-CIR) Capital Area, Brazos, and Kerr Counties
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Resolution:</strong> 12-inch (30 cm) imagery
              </p>
              <p className="text-sm text-gray-600">
                <strong>Access:</strong> <a 
                  href="https://imagery.geographic.texas.gov/server/services/StratMap/StratMap21_NCCIR_CapArea_Brazos_Kerr/ImageServer/WMSServer" 
                  className="text-blue-600 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WMS Server Endpoint
                </a>
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Elevation Data (Planned)</h3>
              <p className="text-gray-700 mb-2">
                <strong>Provider:</strong> Texas Natural Resources Information System (TNRIS)
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Dataset:</strong> StratMap 2021 28cm-50cm Bexar-Travis LiDAR DEM
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Resolution:</strong> 28-50 cm horizontal, ~15 cm vertical accuracy
              </p>
              <p className="text-sm text-gray-600">
                <strong>Access:</strong> <a 
                  href="https://tnris-data-warehouse.s3.us-east-1.amazonaws.com/index.html?prefix=LCD/collection/stratmap-2021-28cm-50cm-bexar-travis/dem/" 
                  className="text-blue-600 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  S3 Bucket - DEM Collection
                </a>
              </p>
              <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded mt-2">
                <strong>Note:</strong> Currently using synthetic test elevation data. Real DEM implementation is pending.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">WMS Image Retrieval</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                The application uses a "safe" WMS bounding box calculation to ensure reliable imagery retrieval:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li>Calculates center point of the user's polygon</li>
                <li>Uses fixed ground resolution (0.35 meters per pixel)</li>
                <li>Converts meters to degrees accounting for latitude</li>
                <li>Builds bbox: <code className="bg-gray-100 px-1 rounded">lon ± deg_lon/2, lat ± deg_lat/2</code></li>
              </ul>
              <div className="bg-gray-50 p-3 rounded-lg mt-3">
                <p className="text-sm font-mono text-gray-800">
                  deg_lon = (mpp × width) / (111320 × cos(lat))
                </p>
                <p className="text-sm font-mono text-gray-800">
                  deg_lat = (mpp × height) / 110574
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Polygon Masking</h3>
              <p className="text-gray-700 leading-relaxed">
                The 3D mesh is generated for the entire bounding box, but elevation is set to 0 for vertices 
                outside the user's polygon. This creates a terrain model that matches the exact shape drawn on the map.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Texture Application</h3>
              <p className="text-gray-700 leading-relaxed">
                Aerial imagery is downloaded from the WMS server, applied as a texture to the 3D mesh using UV mapping, 
                and saved separately for client-side loading in the GLB viewer.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources & Credits */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Sources & Credits</h2>
          
          <div className="space-y-4 text-gray-700">
            <p className="leading-relaxed">
              This project uses publicly available geospatial data from the State of Texas through the 
              Texas Natural Resources Information System (TNRIS).
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Texas Natural Resources Information System (TNRIS)</h3>
              <p className="text-sm text-blue-800 mb-2">
                A division of the Texas Water Development Board
              </p>
              <p className="text-sm text-blue-800">
                Website: <a 
                  href="https://tnris.org" 
                  className="text-blue-600 hover:underline font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  tnris.org
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">StratMap Program</h3>
              <p className="text-gray-700 leading-relaxed">
                The Strategic Mapping Program (StratMap) is a collaborative effort between state and local 
                government entities in Texas to acquire and share high-quality geospatial data. The imagery 
                and elevation data used in this application come from StratMap acquisitions.
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Inspiration</h3>
              <p className="text-gray-700 leading-relaxed">
                This web application was inspired by an original R script using the rayshader package, 
                which demonstrated how to create beautiful 3D terrain visualizations from Austin-area 
                geospatial data.
              </p>
            </div>
          </div>
        </section>

        {/* Technical References */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">References & Resources</h2>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Open Standards</h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>
                  <a href="https://www.ogc.org/standard/wms/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    OGC Web Map Service (WMS)
                  </a> - Standard protocol for serving georeferenced map images
                </li>
                <li>
                  <a href="https://www.khronos.org/gltf/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    glTF 2.0 Specification
                  </a> - 3D model format for efficient transmission
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Key Libraries</h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>
                  <a href="https://leafletjs.com/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Leaflet
                  </a> - Open-source JavaScript library for interactive maps
                </li>
                <li>
                  <a href="https://threejs.org/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Three.js
                  </a> - JavaScript 3D library
                </li>
                <li>
                  <a href="https://turfjs.org/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Turf.js
                  </a> - Advanced geospatial analysis
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Future Improvements */}
        <section className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Planned Enhancements</h2>
          
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-xl">•</span>
              <div>
                <strong>Real DEM Data Integration:</strong> Implement S3 tile indexing, GeoTIFF parsing, 
                and accurate elevation data from TNRIS LiDAR
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-xl">•</span>
              <div>
                <strong>Vertical Exaggeration Control:</strong> Allow users to adjust terrain height scaling
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-xl">•</span>
              <div>
                <strong>Resolution Options:</strong> Let users choose output quality vs. processing time
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-xl">•</span>
              <div>
                <strong>User Accounts:</strong> Save and manage generated terrain models
              </div>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2 text-xl">•</span>
              <div>
                <strong>Batch Processing:</strong> Generate multiple areas at once
              </div>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}

