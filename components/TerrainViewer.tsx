'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface TerrainViewerProps {
  glbUrl?: string;
  className?: string;
}

interface TerrainModelProps {
  url: string;
  autoRotate: boolean;
}

function TerrainModel({ url, autoRotate }: TerrainModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!url) return;

    console.log('[TerrainViewer] Loading GLB from:', url);

    // Get texture URL (same directory as GLB)
    const textureUrl = url.replace('terrain.glb', 'texture.png');
    console.log('[TerrainViewer] Texture URL:', textureUrl);

    // Use dynamic import for GLTFLoader
    import('three-stdlib').then(({ GLTFLoader }) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          console.log('[TerrainViewer] GLB loaded successfully!');
          
          // Load and apply texture to the model
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(
            textureUrl,
            (texture) => {
              console.log('[TerrainViewer] Texture loaded successfully!');
              console.log('[TerrainViewer] Texture size:', texture.image?.width, 'x', texture.image?.height);
              console.log('[TerrainViewer] Texture image src:', texture.image?.src?.substring(0, 100));
              
              // Configure texture for proper display
                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.flipY = true; // Flip Y to match terrain orientation
                texture.needsUpdate = true;
              
              // Apply texture to all meshes in the scene
                gltf.scene.traverse((child) => {
                  if (child instanceof THREE.Mesh) {
                    if (child.material instanceof THREE.MeshStandardMaterial) {
                      // Set material properties for proper texture display
                      child.material.map = texture;
                      child.material.color.set(0xffffff); // White to show texture at full brightness
                      child.material.metalness = 0; // No metallic effect
                      child.material.roughness = 1; // Full roughness for matte appearance
                      child.material.transparent = false; // No transparency
                      child.material.needsUpdate = true;
                      console.log('[TerrainViewer] Texture applied to mesh with proper settings');
                    }
                  }
                });
              
              if (meshRef.current) {
                meshRef.current.add(gltf.scene);
                setLoaded(true);
              }
            },
            undefined,
            (err) => {
              console.warn('[TerrainViewer] Could not load texture, showing without texture:', err);
              // Still show the model even if texture fails
              if (meshRef.current) {
                meshRef.current.add(gltf.scene);
                setLoaded(true);
              }
            }
          );
        },
        (progress) => {
          if (progress.total > 0) {
            console.log('[TerrainViewer] Loading progress:', 
              (progress.loaded / progress.total * 100).toFixed(0) + '%');
          }
        },
        (err) => {
          console.error('[TerrainViewer] Error loading 3D model:', err);
          setError(true);
        }
      );
    }).catch((err) => {
      console.error('[TerrainViewer] Error importing GLTFLoader:', err);
      setError(true);
    });
  }, [url]);

  // Rotate slowly for better view (if enabled)
  useFrame(() => {
    if (meshRef.current && loaded && autoRotate) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  if (error) {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    );
  }

  return <group ref={meshRef} />;
}

function LoadingBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}

export default function TerrainViewer({ glbUrl, className = '' }: TerrainViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`${className} bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden relative`}
    >
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 ${
            autoRotate 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title={autoRotate ? 'Stop rotation' : 'Start rotation'}
        >
          {autoRotate ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rotate
            </>
          )}
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 4h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Fullscreen
            </>
          )}
        </button>
      </div>

      <Canvas>
        <PerspectiveCamera makeDefault position={[80, 60, 80]} fov={50} zoom={0.55} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={50}
          maxDistance={300}
          target={[0, 0, 0]}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 100, 50]} intensity={1.2} castShadow />
        <directionalLight position={[-50, 50, -50]} intensity={0.4} />
        <hemisphereLight args={['#ffffff', '#444444', 0.5]} />
        
        <Suspense fallback={<LoadingBox />}>
          {glbUrl ? (
            <TerrainModel url={glbUrl} autoRotate={autoRotate} />
          ) : (
            <LoadingBox />
          )}
        </Suspense>
      </Canvas>
      
      {!glbUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded">
            No terrain model loaded
          </div>
        </div>
      )}
    </div>
  );
}

