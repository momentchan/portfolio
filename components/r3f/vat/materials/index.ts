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
    uHueShift: { value: 0.0 },
    uTime: { value: 0.0 },
    uNoiseScale: { value: 0.1 },
    uNoiseStrength: { value: 0.1 },
    uSeed: { value: 0.0 },
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

// Update material properties
export function updateVATMaterial(
  material: CustomShaderMaterial,
  materialControls: VATMaterialControls
): void {
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
