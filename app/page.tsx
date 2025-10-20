'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Coordinate } from '@/types';
import { calculateBoundingBox } from '@/lib/geoUtils';
import { downloadFile } from '@/lib/dataFetcher';
import CoordinateForm from '@/components/CoordinateForm';
import TerrainProgress from '@/components/TerrainProgress';
import BasicMap from '@/components/BasicMap';

const TerrainViewer = dynamic(() => import('@/components/TerrainViewer'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-900 rounded-lg animate-pulse" />,
});

interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'error';
  progress: number;
  message?: string;
  files?: {
    png?: string;
    glb?: string;
    stl?: string;
  };
  error?: string;
}

export default function Home() {
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinate[]>([]);
  const [areaAcres, setAreaAcres] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [inputMethod, setInputMethod] = useState<'map' | 'form'>('map');

  // Poll for job status
  useEffect(() => {
    if (!jobStatus || jobStatus.status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/generate-terrain?jobId=${jobStatus.jobId}`);
        
        if (!response.ok) {
          console.error('[App] Job status poll failed:', response.status, response.statusText);
          const text = await response.text();
          console.error('[App] Error response:', text.substring(0, 200));
          return;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[App] Response is not JSON, content-type:', contentType);
          const text = await response.text();
          console.error('[App] Response text:', text.substring(0, 200));
          return;
        }
        
        const data = await response.json();
        setJobStatus(data);

        if (data.status === 'completed' || data.status === 'error') {
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('[App] Error polling job status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobStatus]);

  const handleAreaSelected = (coordinates: Coordinate[], acres: number) => {
    console.log('[App] Area selected:', acres, 'acres,', coordinates.length, 'points');
    setSelectedCoordinates(coordinates);
    setAreaAcres(acres);
  };

  const handleGenerateTerrain = async () => {
    console.log('[App] handleGenerateTerrain called');
    console.log('[App] selectedCoordinates:', selectedCoordinates);
    
    if (selectedCoordinates.length < 3) {
      console.warn('[App] Not enough coordinates');
      alert('Please select an area on the map first');
      return;
    }

    console.log('[App] Starting terrain generation...');
    setIsGenerating(true);
    setJobStatus(null);

    try {
      const boundingBox = calculateBoundingBox(selectedCoordinates);
      console.log('[App] Bounding box:', boundingBox);

      const payload = {
        coordinates: selectedCoordinates,
        boundingBox,
        areaAcres,
      };
      console.log('[App] Sending POST to /api/generate-terrain:', payload);

      const response = await fetch('/api/generate-terrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[App] Response status:', response.status);
      const data = await response.json();
      console.log('[App] Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start terrain generation');
      }

      console.log('[App] Job started:', data.jobId);
      setJobStatus({
        jobId: data.jobId,
        status: 'processing',
        progress: 0,
      });
    } catch (error) {
      console.error('[App] Error generating terrain:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate terrain');
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    downloadFile(url, filename);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-600 mb-4">
            Austin 3D Terrain Generator
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Generate downloadable 3D terrain models from Austin area aerial imagery and elevation data
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Left Column - Map/Form */}
          <div className="w-full">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-6">
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setInputMethod('map')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    inputMethod === 'map'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Draw on Map
                </button>
                <button
                  onClick={() => setInputMethod('form')}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    inputMethod === 'form'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Enter Coordinates
                </button>
              </div>

              {inputMethod === 'map' ? (
                <BasicMap onAreaSelected={handleAreaSelected} maxAreaAcres={1000} />
              ) : (
                <CoordinateForm onCoordinatesSubmit={handleAreaSelected} maxAreaAcres={1000} />
              )}
            </div>

            {/* Generate Button */}
            {selectedCoordinates.length >= 3 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl shadow-xl border border-green-100">
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <p className="text-gray-700">
                      Selected Area: <span className="font-bold text-green-700">{areaAcres.toFixed(2)} acres</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-700">
                      Coordinates: <span className="font-bold text-green-700">{selectedCoordinates.length} points</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateTerrain}
                  disabled={isGenerating}
                  className={`w-full py-4 px-8 rounded-xl font-bold text-lg text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                    isGenerating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/50 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate 3D Terrain
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Preview/Status */}
          <div className="w-full">
            {jobStatus && jobStatus.status === 'processing' && (
              <TerrainProgress
                progress={jobStatus.progress}
                message={jobStatus.message}
                status={jobStatus.status}
              />
            )}

            {jobStatus && jobStatus.status === 'completed' && jobStatus.files && (
              <div className="space-y-4">
                <TerrainProgress
                  progress={100}
                  message="Terrain generation complete!"
                  status="completed"
                />

                {/* 3D Viewer */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">3D Preview</h3>
                  <TerrainViewer glbUrl={jobStatus.files.glb} className="h-[400px] w-full" />
                </div>

                {/* Download Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-semibold mb-4">Download Files</h3>
                  <div className="space-y-3">
                    {jobStatus.files.png && (
                      <button
                        onClick={() => handleDownload(jobStatus.files!.png!, 'terrain-snapshot.png')}
                        className="w-full flex items-center justify-between bg-blue-100 hover:bg-blue-200 text-blue-900 py-3 px-4 rounded-lg transition-colors"
                      >
                        <span className="font-medium">PNG Snapshot (High-Res)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    {jobStatus.files.glb && (
                      <button
                        onClick={() => handleDownload(jobStatus.files!.glb!, 'terrain.glb')}
                        className="w-full flex items-center justify-between bg-purple-100 hover:bg-purple-200 text-purple-900 py-3 px-4 rounded-lg transition-colors"
                      >
                        <span className="font-medium">GLB Model (Interactive 3D)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                    {jobStatus.files.stl && (
                      <button
                        onClick={() => handleDownload(jobStatus.files!.stl!, 'terrain.stl')}
                        className="w-full flex items-center justify-between bg-green-100 hover:bg-green-200 text-green-900 py-3 px-4 rounded-lg transition-colors"
                      >
                        <span className="font-medium">STL File (3D Printable)</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {jobStatus && jobStatus.status === 'error' && (
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <TerrainProgress
                  progress={0}
                  message={jobStatus.error || 'An error occurred'}
                  status="error"
                />
                <button
                  onClick={() => {
                    setJobStatus(null);
                    setIsGenerating(false);
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            )}

            {!jobStatus && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-10 rounded-2xl shadow-xl border border-blue-100 h-full flex flex-col items-center justify-center">
                <svg className="w-24 h-24 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">Preview</h3>
                <p className="text-gray-600 text-center">
                  Your 3D terrain model will appear here after generation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-10 rounded-3xl shadow-2xl border border-gray-100">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50 group-hover:shadow-xl">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Select Area</h3>
              <p className="text-gray-600 leading-relaxed">
                Draw a polygon on the map or enter coordinates to define your area of interest
              </p>
            </div>
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg shadow-green-500/50 group-hover:shadow-xl">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Generate</h3>
              <p className="text-gray-600 leading-relaxed">
                Our system fetches high-resolution imagery and elevation data, then processes it into a 3D model
              </p>
            </div>
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50 group-hover:shadow-xl">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Download</h3>
              <p className="text-gray-600 leading-relaxed">
                Download your terrain as a high-res PNG, interactive GLB model, or 3D-printable STL file
              </p>
            </div>
          </div>
        </div>
    </div>
    </main>
  );
}
