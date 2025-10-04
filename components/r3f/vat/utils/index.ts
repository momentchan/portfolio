import * as THREE from 'three'
import { VATMeta } from '../types'

// Ensure UV2 attribute exists for VAT geometry
export function ensureUV2ForVAT(geometry: THREE.BufferGeometry, meta: VATMeta): void {
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

// Generate random position inside sphere
export function generateSpherePosition(radius: number = 0.5): [number, number, number] {
  const theta = Math.random() * Math.PI * 2 // 0 to 2π
  const phi = Math.acos(2 * Math.random() - 1) // 0 to π
  const r = Math.cbrt(Math.random()) * radius // Cube root for uniform volume distribution
  
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  ]
}

// Calculate camera-facing rotation
export function calculateCameraFacingRotation(
  meshPosition: THREE.Vector3,
  cameraPosition: THREE.Vector3,
  offsetAngle: number = 0
): THREE.Quaternion {
  const direction = cameraPosition.clone().sub(meshPosition).normalize()
  
  // Apply offset by rotating the direction vector
  if (offsetAngle !== 0) {
    const rotationMatrix = new THREE.Matrix4().makeRotationY(offsetAngle)
    direction.applyMatrix4(rotationMatrix)
  }
  
  const up = new THREE.Vector3(0, 1, 0) // Y-axis
  const quaternion = new THREE.Quaternion()
  
  // Set quaternion to rotate from current up axis to camera direction
  quaternion.setFromUnitVectors(up, direction)
  
  return quaternion
}

// Apply random rotation offsets
export function applyRandomRotationOffsets(
  baseQuaternion: THREE.Quaternion,
  maxXRotation: number = 45,
  maxZRotation: number = 45
): THREE.Quaternion {
  const randomX = Math.random() * maxXRotation * (Math.random() > 0.5 ? 1 : -1)
  const randomZ = Math.random() * maxZRotation * (Math.random() > 0.5 ? 1 : -1)
  
  const xRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0), 
    THREE.MathUtils.degToRad(randomX)
  )
  const zRotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1), 
    THREE.MathUtils.degToRad(randomZ)
  )
  
  // Combine rotations
  const result = baseQuaternion.clone()
  result.multiply(xRotationQuaternion)
  result.multiply(zRotationQuaternion)
  
  return result
}

