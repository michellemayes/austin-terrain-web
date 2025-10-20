'use client';

interface TerrainProgressProps {
  progress: number;
  message?: string;
  status: 'processing' | 'completed' | 'error';
}

export default function TerrainProgress({ progress, message, status }: TerrainProgressProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      {status === 'processing' && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">Generating 3D Terrain...</h3>
            {message && (
              <p className="text-sm text-gray-600">{message}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-3 text-green-600">
          <svg className="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-gray-900">Complete!</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <h3 className="font-semibold text-gray-900">Error</h3>
            {message && (
              <p className="text-sm text-red-600">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

