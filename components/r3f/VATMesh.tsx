import * as THREE from 'three'
import React, { useEffect, useMemo, useRef, createContext, useContext } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { useControls } from 'leva'
import photoshopMath from '../../lib/r3f-gist/shader/cginc/photoshopMath.glsl?raw'
import simplexNoise from '../../lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl?raw'

// Types
interface VATMeta {
  vertexCount: number
  frameCount: number
  fps: number
  texWidth: number
  texHeight: number
  columns: number
  frameStride: number
  storeDelta: boolean
  normalsCompressed: boolean
}

export interface VATMeshProps {
  // Preloaded resources
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex?: THREE.Texture | null
  mapTex?: THREE.Texture | null
  maskTex?: THREE.Texture | null
  metaData: VATMeta
  speed?: number
  timeOffset?: number
  paused?: boolean
  useDepthMaterial?: boolean
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
  // External frame control
  frame?: number
}

// Shared resource types
interface VATResources {
  gltf: THREE.Group
  posTex: THREE.Texture
  nrmTex: THREE.Texture | null
  mapTex: THREE.Texture | null
  maskTex: THREE.Texture | null
  meta: VATMeta
  refCount: number
}

interface VATResourceCache {
  [key: string]: VATResources
}

interface MaterialControls {
  roughness: number
  metalness: number
  transmission: number
  thickness: number
  ior: number
  clearcoat: number
  clearcoatRoughness: number
  reflectivity: number
  envMapIntensity: number
  sheen: number
  sheenRoughness: number
  sheenColor: string
  iridescence: number
  iridescenceIOR: number
  iridescenceThicknessMin: number
  iridescenceThicknessMax: number
  attenuationDistance: number
  attenuationColor: string
  bumpScale: number
  hueShift: number
  noiseScale: number
  noiseStrength: number
  speed: number
}

// Constants
const DEFAULT_MATERIAL_CONTROLS: MaterialControls = {
  roughness: 0.25,
  metalness: 0.6,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  clearcoat: 0.1,
  clearcoatRoughness: 0.1,
  reflectivity: 0.5,
  envMapIntensity: 1,
  sheen: 0,
  sheenRoughness: 0.1,
  sheenColor: '#3695ff',
  iridescence: 0,
  iridescenceIOR: 1.3,
  iridescenceThicknessMin: 100,
  iridescenceThicknessMax: 400,
  attenuationDistance: Infinity,
  attenuationColor: '#ffffff',
  bumpScale: 1.0,
  hueShift: 0.0,
  noiseScale: 10,
  noiseStrength: 0.2,
  speed: 0.3,
}

// Global resource cache for sharing resources between instances
const resourceCache: VATResourceCache = {}

// Resource management functions
function createResourceKey(glb: string, pos: string, nrm: string | null, map: string | null, mask: string | null, meta: string): string {
  return `${glb}|${pos}|${nrm || 'null'}|${map || 'null'}|${mask || 'null'}|${meta}`
}

function releaseVATResources(glb: string, pos: string, nrm: string | null, map: string | null, mask: string | null, meta: string): void {
  const key = createResourceKey(glb, pos, nrm, map, mask, meta)
  
  if (resourceCache[key]) {
    resourceCache[key].refCount--
    
    if (resourceCache[key].refCount <= 0) {
      // Dispose of textures when no longer needed
      resourceCache[key].posTex.dispose()
      if (resourceCache[key].nrmTex) resourceCache[key].nrmTex.dispose()
      if (resourceCache[key].mapTex) resourceCache[key].mapTex.dispose()
      if (resourceCache[key].maskTex) resourceCache[key].maskTex.dispose()
      
      delete resourceCache[key]
    }
  }
}

// Utility functions
function setupVATTexture(tex?: THREE.Texture | null): void {
  if (!tex) return

  tex.colorSpace = THREE.NoColorSpace
  tex.generateMipmaps = false
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.type = THREE.FloatType
}

function setupMapTexture(tex?: THREE.Texture | null): void {
  if (!tex) return

  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
}

function ensureUV2ForVAT(geometry: THREE.BufferGeometry, meta: VATMeta): void {
  if (geometry.getAttribute('uv2')) return

  const count = geometry.getAttribute('position').count
  const uv2Array = new Float32Array(count * 2)

  for (let i = 0; i < count; i++) {
    const colIndex = Math.floor(i / meta.texHeight)
    const vIndex = i % meta.texHeight
    const px = colIndex * meta.frameStride
    const py = vIndex
    const u = (px + 0.5) / meta.texWidth
    const v = (py + 0.5) / meta.texHeight

    uv2Array[2 * i + 0] = u
    uv2Array[2 * i + 1] = v
  }

  geometry.setAttribute('uv2', new THREE.BufferAttribute(uv2Array, 2))
}

function getLoaderForExtension(url: string) {
  return url.toLowerCase().endsWith('.png') ? THREE.TextureLoader : EXRLoader
}

function configureEXRLoader(loader: any): void {
  if (loader instanceof EXRLoader) {
    loader.setDataType(THREE.FloatType)
  }
}

// Shader code
const VAT_VERTEX_SHADER = /* glsl */`
  ${simplexNoise}
  attribute vec2 uv2;
  uniform sampler2D uPosTex;
  uniform sampler2D uNrmTex;
  uniform sampler2D uMapTex;
  uniform float uFrame;
  uniform float uFrames;
  uniform float uTexW;
  uniform int uStoreDelta;
  uniform int uNormalsCompressed;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  varying vec2 vUv;
  varying vec2 vUv2;

  vec3 octDecode(vec2 e) {
    e = e * 2.0 - 1.0;
    vec3 v = vec3(e.x, e.y, 1.0 - abs(e.x) - abs(e.y));
    if (v.z < 0.0) v.xy = (1.0 - abs(v.yx)) * sign(v.xy);
    return normalize(v);
  }

  vec3 VAT_pos_f(float f) {
    float fx = (f + 0.5) / uTexW;
    vec2 uv = vec2(uv2.x + fx, uv2.y);
    return texture2D(uPosTex, uv).xyz;
  }

  vec3 VAT_pos(float f) {
    float f0 = floor(f);
    float f1 = min(f0 + 1.0, uFrames - 1.0);
    vec3 p0 = VAT_pos_f(f0);
    vec3 p1 = VAT_pos_f(f1);
    return mix(p0, p1, fract(f));
  }

  vec3 VAT_nrm_f(float f) {
    float fx = (f + 0.5) / uTexW;
    vec2 uv = vec2(uv2.x + fx, uv2.y);
    vec4 texel = texture2D(uNrmTex, uv);
    if (uNormalsCompressed == 1) {
      // PNG format - use octDecode for compressed normals
      return octDecode(texel.xy);
    } else {
      // EXR format - direct normal data
      return normalize(texel.xyz);
    }
  }

  vec3 VAT_nrm(float f) {
    float f0 = floor(f);
    float f1 = min(f0 + 1.0, uFrames - 1.0);
    vec3 n0 = VAT_nrm_f(f0);
    vec3 n1 = VAT_nrm_f(f1);
    return normalize(mix(n0, n1, fract(f)));
  }

  void main() {
    vec3 vatPos = VAT_pos(uFrame);
    vec3 basePos = position;
    vatPos += snoiseVec3(vec3(uv, 0.0) * uNoiseScale) * uNoiseStrength * 0.001;

    vec3 position =(uStoreDelta == 1) ? (basePos + vatPos) : vatPos;


    csm_Position = position;
    csm_Normal = VAT_nrm(uFrame);
    vUv = uv;
    vUv2 = uv2;
  }
`


const VAT_FRAGMENT_SHADER = /* glsl */`
  ${photoshopMath}
  uniform sampler2D uMapTex;
  uniform sampler2D uMaskTex;
  uniform float uHueShift;
  uniform float uTime;

  varying vec2 vUv;
  varying vec2 vUv2;

  void main() {
    vec4 color = texture2D(uMapTex, vUv);
    vec4 mask = texture2D(uMaskTex, vUv);
    
    if (mask.r > 0.5) {
      discard;
    }

    color.rgb = HSVShift(color.rgb, vec3(uHueShift, 0.0, 0.0));
    
    csm_DiffuseColor = color;

    float l =  1.0 - vUv.y;
    // Create smooth animated gradient with seamless looping
    float animatedPos = mod(uTime, 1.0);
    float distance1 = abs(l - animatedPos);
    float distance2 = abs(l - (animatedPos + 1.0));
    float distance3 = abs(l - (animatedPos - 1.0));
    float distance = min(min(distance1, distance2), distance3);
    float gradient = smoothstep(0.2, 0.0, distance);
    csm_Emissive = gradient * color.rgb * 0.5;
  }
`

// Material creation
function createVATMaterial(
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  mapTex: THREE.Texture | null,
  maskTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  meta: VATMeta,
  materialProps: MaterialControls
): CustomShaderMaterial {
  const uniforms = {
    uPosTex: { value: posTex },
    uNrmTex: { value: nrmTex },
    uMapTex: { value: mapTex },
    uMaskTex: { value: maskTex },
    uFrame: { value: 0.0 },
    uFrames: { value: meta.frameCount },
    uTexW: { value: meta.texWidth },
    uStoreDelta: { value: meta.storeDelta ? 1 : 0 },
    uNormalsCompressed: { value: meta.normalsCompressed ? 1 : 0 },
    uHueShift: { value: 0.0 },
    uTime: { value: 0.0 },
    uNoiseScale: { value: 0.1 },
    uNoiseStrength: { value: 0.1 },
  }

  // Filter out custom properties that aren't valid Three.js material properties
  const { hueShift, iridescenceThicknessMin, iridescenceThicknessMax, noiseScale, noiseStrength, speed, ...validMaterialProps } = materialProps

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: VAT_VERTEX_SHADER,
    fragmentShader: VAT_FRAGMENT_SHADER,
    uniforms,
    envMap: envMap,
    bumpMap: mapTex,
    side: THREE.DoubleSide,
    ...validMaterialProps,
  })
}

function createVATDepthMaterial(
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  meta: VATMeta
): CustomShaderMaterial {
  const uniforms = {
    uPosTex: { value: posTex },
    uNrmTex: { value: nrmTex },
    uFrame: { value: 0.0 },
    uFrames: { value: meta.frameCount },
    uTexW: { value: meta.texWidth },
    uStoreDelta: { value: meta.storeDelta ? 1 : 0 },
    uNormalsCompressed: { value: meta.normalsCompressed ? 1 : 0 },
    uHueShift: { value: 0.0 },
    uNoiseScale: { value: 0.1 },
    uNoiseStrength: { value: 0.1 },
  }

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: VAT_VERTEX_SHADER,
    uniforms,
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  })
}


function useMaterialControls() {
  return useControls('VAT Physical Material', {
    roughness: { value: DEFAULT_MATERIAL_CONTROLS.roughness, min: 0, max: 1, step: 0.01 },
    metalness: { value: DEFAULT_MATERIAL_CONTROLS.metalness, min: 0, max: 1, step: 0.01 },
    transmission: { value: DEFAULT_MATERIAL_CONTROLS.transmission, min: 0, max: 1, step: 0.01 },
    thickness: { value: DEFAULT_MATERIAL_CONTROLS.thickness, min: 0, max: 10, step: 0.1 },
    ior: { value: DEFAULT_MATERIAL_CONTROLS.ior, min: 1, max: 2.5, step: 0.01 },
    clearcoat: { value: DEFAULT_MATERIAL_CONTROLS.clearcoat, min: 0, max: 1, step: 0.01 },
    clearcoatRoughness: { value: DEFAULT_MATERIAL_CONTROLS.clearcoatRoughness, min: 0, max: 1, step: 0.01 },
    reflectivity: { value: DEFAULT_MATERIAL_CONTROLS.reflectivity, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: DEFAULT_MATERIAL_CONTROLS.envMapIntensity, min: 0, max: 2, step: 0.1 },
    sheen: { value: DEFAULT_MATERIAL_CONTROLS.sheen, min: 0, max: 1, step: 0.01 },
    sheenRoughness: { value: DEFAULT_MATERIAL_CONTROLS.sheenRoughness, min: 0, max: 1, step: 0.01 },
    sheenColor: DEFAULT_MATERIAL_CONTROLS.sheenColor,
    iridescence: { value: DEFAULT_MATERIAL_CONTROLS.iridescence, min: 0, max: 1, step: 0.01 },
    iridescenceIOR: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceIOR, min: 1, max: 2.333, step: 0.01 },
    iridescenceThicknessMin: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMin, min: 0, max: 1000, step: 10 },
    iridescenceThicknessMax: { value: DEFAULT_MATERIAL_CONTROLS.iridescenceThicknessMax, min: 0, max: 1000, step: 10 },
    attenuationDistance: { value: DEFAULT_MATERIAL_CONTROLS.attenuationDistance, min: 0.01, max: 10, step: 0.01 },
    attenuationColor: DEFAULT_MATERIAL_CONTROLS.attenuationColor,
    bumpScale: { value: DEFAULT_MATERIAL_CONTROLS.bumpScale, min: 0, max: 1, step: 0.01 },
    hueShift: { value: DEFAULT_MATERIAL_CONTROLS.hueShift, min: -1, max: 1, step: 0.01 },
    noiseScale: { value: DEFAULT_MATERIAL_CONTROLS.noiseScale, min: 0, max: 10, step: 0.1 },
    noiseStrength: { value: DEFAULT_MATERIAL_CONTROLS.noiseStrength, min: 0, max: 1, step: 0.01 },
    speed : {value: DEFAULT_MATERIAL_CONTROLS.speed, min: 0, max: 1, step: 0.01 },
  }, { collapsed: true })
}

// Main component
export function VATMesh({
  gltf,
  posTex,
  nrmTex = null,
  mapTex = null,
  maskTex = null,
  metaData,
  speed = 1,
  timeOffset = 0,
  paused = false,
  useDepthMaterial = true,
  frame: externalFrame,
  ...rest
}: VATMeshProps) {
  const materialControls = useMaterialControls()

  const groupRef = useRef<THREE.Group>(null!)
  const materialsRef = useRef<CustomShaderMaterial[]>([])
  const startTimeRef = useRef<number>(0)
  const { scene } = useThree()


  // Create materials and clone scene for this instance
  useEffect(() => {
    materialsRef.current.length = 0

    // Clone the scene for this instance to avoid sharing geometry between instances
    const clonedScene = gltf.clone()
    
    clonedScene.traverse((object: any) => {
      if (object.isMesh) {
        const mesh = object as THREE.Mesh

        ensureUV2ForVAT(mesh.geometry, metaData)

        // Create unique materials for this instance
        const vatMaterial = createVATMaterial(posTex, nrmTex, mapTex, maskTex, scene.environment, metaData, materialControls)
        mesh.material = vatMaterial
        materialsRef.current.push(vatMaterial)

        // Optionally add custom depth material
        if (useDepthMaterial) {
          const vatDepthMaterial = createVATDepthMaterial(posTex, nrmTex, metaData)
          mesh.customDepthMaterial = vatDepthMaterial
          materialsRef.current.push(vatDepthMaterial)
        }

        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
      }
    })

    // Store the cloned scene reference
    if (groupRef.current) {
      groupRef.current.clear()
      groupRef.current.add(clonedScene)
    }

    startTimeRef.current = performance.now() / 1000
  }, [gltf, posTex, nrmTex, metaData, useDepthMaterial])

  // Update material properties
  useEffect(() => {
    for (const material of materialsRef.current) {
      material.uniforms.uHueShift.value = materialControls.hueShift
      material.uniforms.uNoiseScale.value = materialControls.noiseScale
      material.uniforms.uNoiseStrength.value = materialControls.noiseStrength


      // Only update physical material properties, skip depth materials
      if (material.uniforms?.uNrmTex) {
        Object.assign(material, {
          roughness: materialControls.roughness,
          metalness: materialControls.metalness,
          transmission: materialControls.transmission,
          thickness: materialControls.thickness,
          ior: materialControls.ior,
          clearcoat: materialControls.clearcoat,
          clearcoatRoughness: materialControls.clearcoatRoughness,
          reflectivity: materialControls.reflectivity,
          envMapIntensity: materialControls.envMapIntensity,
          sheen: materialControls.sheen,
          sheenRoughness: materialControls.sheenRoughness,
          sheenColor: new THREE.Color(materialControls.sheenColor),
          iridescence: materialControls.iridescence,
          iridescenceIOR: materialControls.iridescenceIOR,
          iridescenceThicknessRange: [
            materialControls.iridescenceThicknessMin,
            materialControls.iridescenceThicknessMax
          ],
          attenuationDistance: materialControls.attenuationDistance,
          attenuationColor: new THREE.Color(materialControls.attenuationColor),
          bumpScale: materialControls.bumpScale,
        })

        material.needsUpdate = true
      }
    }
  }, [materialControls])

  // Update depth material properties (frame animation)
  useEffect(() => {
    for (const material of materialsRef.current) {
      // Update frame uniform for all materials (both physical and depth)
      if (material.uniforms?.uFrame) {
        material.uniforms.uFrame.value = 0.0 // Reset to frame 0
      }
    }
  }, [useDepthMaterial])

  // Animation frame update
  useFrame((state) => {
    if (paused) return

    const currentTime = state.clock.elapsedTime
    
    // Use external frame if provided, otherwise use normal animation
    let frame: number
    
    if (externalFrame !== undefined) {
      // External frame control
      frame = Math.min(externalFrame * metaData.frameCount, metaData.frameCount - 5)
    } else {
      // Normal VAT animation
      frame = currentTime * (metaData.fps * speed) % metaData.frameCount
    }
    
    // Update materials
    for (const material of materialsRef.current) {
      if (material.uniforms?.uFrame) {
        material.uniforms.uFrame.value = frame
      }
      if (material.uniforms?.uTime) {
        material.uniforms.uTime.value = currentTime * materialControls.speed
      }
    }
  })

  return (
    <group ref={groupRef} {...rest} />
  )
}