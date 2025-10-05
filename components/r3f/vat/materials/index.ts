import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
import { VATMeta, VATMaterialControls } from '../types'
import { VAT_VERTEX_SHADER, VAT_FRAGMENT_SHADER } from '../shaders'

// Create VAT material with custom shaders
export function createVATMaterial(
  posTex: THREE.Texture,
  nrmTex: THREE.Texture | null,
  mapTex: THREE.Texture | null,
  maskTex: THREE.Texture | null,
  envMap: THREE.Texture | null,
  meta: VATMeta,
  materialProps: VATMaterialControls
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
    uTime: { value: 0.0 },
    uSeed: { value: 0.0 },
    // Shader uniforms from material controls
    uHueShift: { value: materialProps.hueShift },
    uNoiseScale: { value: materialProps.noiseScale },
    uNoiseStrength: { value: materialProps.noiseStrength },
    uSpeed: { value: materialProps.speed },
  }

  // Only pass valid Three.js material properties
  const threeJsMaterialProps = {
    roughness: materialProps.roughness,
    metalness: materialProps.metalness,
    transmission: materialProps.transmission,
    thickness: materialProps.thickness,
    ior: materialProps.ior,
    clearcoat: materialProps.clearcoat,
    clearcoatRoughness: materialProps.clearcoatRoughness,
    reflectivity: materialProps.reflectivity,
    envMapIntensity: materialProps.envMapIntensity,
    sheen: materialProps.sheen,
    sheenRoughness: materialProps.sheenRoughness,
    sheenColor: new THREE.Color(materialProps.sheenColor),
    iridescence: materialProps.iridescence,
    iridescenceIOR: materialProps.iridescenceIOR,
    iridescenceThicknessRange: [materialProps.iridescenceThicknessMin, materialProps.iridescenceThicknessMax] as [number, number],
    attenuationDistance: materialProps.attenuationDistance,
    attenuationColor: new THREE.Color(materialProps.attenuationColor),
    bumpScale: materialProps.bumpScale,
  }

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader: VAT_VERTEX_SHADER,
    fragmentShader: VAT_FRAGMENT_SHADER,
    uniforms,
    envMap: envMap,
    bumpMap: mapTex,
    side: THREE.DoubleSide,
    ...threeJsMaterialProps,
  })
}

// Create VAT depth material for shadow casting
export function createVATDepthMaterial(
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
    uSeed: { value: 0.0 },
  }

  return new CustomShaderMaterial({
    baseMaterial: THREE.MeshDepthMaterial,
    vertexShader: VAT_VERTEX_SHADER,
    uniforms,
    depthPacking: THREE.RGBADepthPacking,
    side: THREE.DoubleSide,
  })
}

// Update shader uniforms
export function updateShaderUniforms(
  material: CustomShaderMaterial,
  shaderControls: Pick<VATMaterialControls, 'hueShift' | 'noiseScale' | 'noiseStrength'>
): void {
  material.uniforms.uHueShift.value = shaderControls.hueShift
  material.uniforms.uNoiseScale.value = shaderControls.noiseScale
  material.uniforms.uNoiseStrength.value = shaderControls.noiseStrength
}

// Update physical material properties
export function updatePhysicalProperties(
  material: CustomShaderMaterial,
  physicalControls: Pick<VATMaterialControls, 
    'roughness' | 'metalness' | 'transmission' | 'thickness' | 'ior' | 
    'clearcoat' | 'clearcoatRoughness' | 'reflectivity' | 'envMapIntensity' | 'bumpScale'
  >
): void {
  // Only update physical material properties, skip depth materials
  if (material.uniforms?.uNrmTex) {
    Object.assign(material, {
      roughness: physicalControls.roughness,
      metalness: physicalControls.metalness,
      transmission: physicalControls.transmission,
      thickness: physicalControls.thickness,
      ior: physicalControls.ior,
      clearcoat: physicalControls.clearcoat,
      clearcoatRoughness: physicalControls.clearcoatRoughness,
      reflectivity: physicalControls.reflectivity,
      envMapIntensity: physicalControls.envMapIntensity,
      bumpScale: physicalControls.bumpScale,
    })
    material.needsUpdate = true
  }
}

// Update advanced material properties
export function updateAdvancedProperties(
  material: CustomShaderMaterial,
  advancedControls: Pick<VATMaterialControls,
    'sheen' | 'sheenRoughness' | 'sheenColor' | 'iridescence' | 'iridescenceIOR' |
    'iridescenceThicknessMin' | 'iridescenceThicknessMax' | 'attenuationDistance' | 'attenuationColor'
  >
): void {
  // Only update physical material properties, skip depth materials
  if (material.uniforms?.uNrmTex) {
    Object.assign(material, {
      sheen: advancedControls.sheen,
      sheenRoughness: advancedControls.sheenRoughness,
      sheenColor: new THREE.Color(advancedControls.sheenColor),
      iridescence: advancedControls.iridescence,
      iridescenceIOR: advancedControls.iridescenceIOR,
      iridescenceThicknessRange: [
        advancedControls.iridescenceThicknessMin,
        advancedControls.iridescenceThicknessMax
      ] as [number, number],
      attenuationDistance: advancedControls.attenuationDistance,
      attenuationColor: new THREE.Color(advancedControls.attenuationColor),
    })
    material.needsUpdate = true
  }
}

// Update material properties (legacy function for backward compatibility)
export function updateVATMaterial(
  material: CustomShaderMaterial,
  materialControls: VATMaterialControls
): void {
  updateShaderUniforms(material, materialControls)
  updatePhysicalProperties(material, materialControls)
  updateAdvancedProperties(material, materialControls)
}
