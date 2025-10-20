'use client';

interface TerrainProgressProps {
  progress: number;
  message?: string;
  status: 'processing' | 'completed' | 'error';
}

export default function TerrainProgress({ progress, message, status }: TerrainProgressProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status === 'processing' && 'Generating 3D Terrain...'}
            {status === 'completed' && 'Complete!'}
            {status === 'error' && 'Error'}
          </span>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === 'error' 
                ? 'bg-red-500' 
                : status === 'completed'
                ? 'bg-green-500'
                : 'bg-blue-500 animate-pulse'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}

      {status === 'processing' && (
        <div className="mt-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      )}

      {status === 'completed' && (
        <div className="mt-4 flex items-center justify-center text-green-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 flex items-center justify-center text-red-600">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
    </div>
  );
}

