export interface Coordinate {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface TerrainRequest {
  coordinates: Coordinate[];
  boundingBox: BoundingBox;
  areaAcres: number;
}

export interface TerrainResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'error';
  progress?: number;
  files?: {
    png?: string;
    glb?: string;
    stl?: string;
  };
  error?: string;
}

export interface TerrainJobStatus {
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

