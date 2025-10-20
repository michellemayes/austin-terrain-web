'use client';

import { useState } from 'react';

export default function HelpSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 transition-all duration-200 hover:scale-110 group"
        aria-label="Open help"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          ?
        </span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Help & Guide</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close help"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-blue-100 text-sm">
            Learn how to use the Austin 3D Terrain Generator
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-120px)] p-6">
          {/* How It Works */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Select Area</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Draw a polygon on the map or enter coordinates to define your area of interest.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Generate</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Our system fetches high-resolution imagery and elevation data, then processes it into a 3D model.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Download</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Download your terrain as a high-res PNG, interactive GLB model, or 3D-printable STL file.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Tips */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Tips</h3>
            <div className="space-y-3">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                <p className="text-sm text-blue-900 font-medium mb-1">Best Imagery Coverage</p>
                <p className="text-sm text-blue-800">
                  Draw polygons in central Austin (around 30.27, -97.74) for optimal aerial imagery quality.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                <p className="text-sm text-green-900 font-medium mb-1">3D Viewer Controls</p>
                <p className="text-sm text-green-800">
                  Use Pause/Rotate and Fullscreen buttons in the viewer. Drag to orbit, scroll to zoom.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
                <p className="text-sm text-purple-900 font-medium mb-1">File Formats</p>
                <p className="text-sm text-purple-800">
                  PNG for images, GLB for 3D viewers, STL for 3D printing.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-sm text-yellow-900 font-medium mb-1">Test Elevation Data</p>
                <p className="text-sm text-yellow-800">
                  Currently using synthetic terrain. Real LiDAR data coming soon!
                </p>
              </div>
            </div>
          </section>

          {/* Example Coordinates */}
          <section className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Example Coordinates</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Downtown Austin</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800">
                  30.2672, -97.7431<br />
                  30.2680, -97.7431<br />
                  30.2680, -97.7420<br />
                  30.2672, -97.7420
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Texas State Capitol</p>
                <div className="bg-gray-100 p-2 rounded font-mono text-xs text-gray-800">
                  30.2747, -97.7403<br />
                  30.2755, -97.7403<br />
                  30.2755, -97.7390<br />
                  30.2747, -97.7390
                </div>
              </div>
            </div>
          </section>

          {/* Links */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4">More Information</h3>
            <div className="space-y-2">
              <a
                href="/docs"
                className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <p className="text-sm font-semibold text-blue-900">View Full Documentation</p>
                <p className="text-xs text-blue-700">Technical details, data sources, and more</p>
              </a>
              <a
                href="https://tnris.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <p className="text-sm font-semibold text-green-900">TNRIS Data Source</p>
                <p className="text-xs text-green-700">Texas Natural Resources Information System</p>
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

