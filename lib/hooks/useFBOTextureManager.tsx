import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FBOTextureRef {
  getFBOTexture: () => THREE.Texture | null;
  getMaterial?: () => THREE.ShaderMaterial | null;
  clearTraces?: () => void;
}

interface FBOTextureManagerProps {
  refs: Array<React.RefObject<FBOTextureRef | null>>;
  onTextureUpdate: (textures: Array<THREE.Texture | null>) => void;
  enabled?: boolean;
}

export function FBOTextureManager({ 
  refs, 
  onTextureUpdate, 
  enabled = true 
}: FBOTextureManagerProps) {
  const previousTextures = useRef<Array<THREE.Texture | null>>([]);

  const updateTextures = useCallback(() => {
    if (!enabled) return;

    const currentTextures = refs.map(ref => 
      ref.current?.getFBOTexture() || null
    );

    // Only update if textures have changed
    const hasChanged = currentTextures.some((texture, index) => 
      texture !== previousTextures.current[index]
    );

    if (hasChanged) {
      previousTextures.current = currentTextures;
      onTextureUpdate(currentTextures);
    }
  }, [refs, onTextureUpdate, enabled]);

  useFrame(() => {
    updateTextures();
  });

  return null;
}
