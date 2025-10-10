import React from 'react'

export interface DebugAxesProps {
  visible?: boolean
  size?: number
  position?: [number, number, number]
}

export function DebugAxes({ visible = false, size = 1, position = [0, 0, 0] }: DebugAxesProps) {
  if (!visible) return null
  
  return (
    <group position={position}>
      {/* X-axis (red) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, size]} />
        <meshBasicMaterial color="red" />
      </mesh>
      {/* Y-axis (green) */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, size]} />
        <meshBasicMaterial color="green" />
      </mesh>
      {/* Z-axis (blue) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, size]} />
        <meshBasicMaterial color="blue" />
      </mesh>
    </group>
  )
}
