import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import { TextureLoader } from 'three'

// Helper function to get the appropriate loader for file extension
function getLoaderForExtension(url: string) {
  const ext = url.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'exr':
      return EXRLoader
    case 'png':
    case 'jpg':
    case 'jpeg':
    default:
      return TextureLoader
  }
}

// Helper function to configure EXR loader
function configureEXRLoader(loader: any) {
  if (loader.constructor.name === 'EXRLoader') {
    loader.setDataType(THREE.FloatType)
  }
}

// Hook to preload VAT resources
export function useVATPreloader(glb: string, pos: string, nrm?: string | null, map?: string | null, mask?: string | null, metaUrl?: string) {
  // Use useGLTF instead of useLoader to leverage drei's caching
  const gltf = useGLTF(glb)
  const posTex = useLoader(getLoaderForExtension(pos), pos, configureEXRLoader)
  const nrmTex = nrm ? useLoader(getLoaderForExtension(nrm), nrm, configureEXRLoader) : null
  const mapTex = map ? useLoader(getLoaderForExtension(map), map, configureEXRLoader) : null
  const maskTex = mask ? useLoader(getLoaderForExtension(mask), mask, configureEXRLoader) : null
  
  // Load meta data
  const metaResponse = metaUrl ? useLoader(THREE.FileLoader, metaUrl) : null
  const meta = metaResponse ? JSON.parse(metaResponse as string) : null

  return {
    gltf,
    posTex,
    nrmTex,
    mapTex,
    maskTex,
    meta,
    isLoaded: !!(gltf && posTex && (!nrm || nrmTex) && (!map || mapTex) && (!mask || maskTex) && (!metaUrl || meta))
  }
}

// Export preload function for manual preloading
export const preloadVATAssets = (glb: string) => {
  useGLTF.preload(glb)
}
