import React, { useRef, useState } from 'react'
import * as THREE from 'three'

export interface InteractiveTriggerProps {
    size?: number
    position?: [number, number, number]
    onTrigger?: (triggerType: 'click' | 'hover' | 'collision', data?: any) => void
    id?: string | number
    visible?: boolean
    color?: string
    opacity?: number
    wireframe?: boolean
}

export function InteractiveTrigger({
    size = 1,
    position = [0, 0, 0],
    onTrigger,
    id,
    visible = true,
    color = '#ffffff',
    opacity = 0.2,
    wireframe = true
}: InteractiveTriggerProps) {
    const triggerRef = useRef<THREE.Mesh>(null!)
    const [isHovered, setIsHovered] = useState(false)
    const [wasClicked, setWasClicked] = useState(false)
    const triggerDataRef = useRef({
        lastTriggerTime: 0,
        triggerCooldown: 500 // 500ms cooldown between triggers
    })

    // Handle trigger events with cooldown (only for clicks)
    const handleTrigger = (triggerType: 'click' | 'hover' | 'collision', data?: any) => {
        // Only apply cooldown to clicks
        if (triggerType === 'click') {
            const now = Date.now()
            if (now - triggerDataRef.current.lastTriggerTime < triggerDataRef.current.triggerCooldown) {
                return
            }
            triggerDataRef.current.lastTriggerTime = now
        }

        if (onTrigger) {
            onTrigger(triggerType, {
                id,
                position: triggerRef.current?.position.clone(),
                data
            })
        }
    }

    const handlePointerOver = () => {
        setIsHovered(true)
        handleTrigger('hover', { isHovered: true })
    }

    const handlePointerOut = () => {
        setIsHovered(false)
        handleTrigger('hover', { isHovered: false })
    }

    const handleClick = (event: any) => {
        event.stopPropagation()
        setWasClicked(true)
        handleTrigger('click', { clicked: true })

        // Reset click state after animation
        setTimeout(() => setWasClicked(false), 200)
    }

    // Determine visual state
    const getVisualColor = () => {
        if (wasClicked) return '#ff4444' // Red for click
        if (isHovered) return '#44ff44'  // Green for hover
        return color // Default color
    }

    const getVisualOpacity = () => {
        if (wasClicked) return Math.max(opacity, 0.3) // Higher opacity for click
        if (isHovered) return Math.max(opacity, 0.15) // Slightly higher for hover
        return opacity // Default opacity
    }

    if (!visible) return null

    return (
        <mesh
            ref={triggerRef}
            position={position}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
        >
            <boxGeometry args={[size, size, size]} />
            <meshBasicMaterial
                color={getVisualColor()}
                wireframe={wireframe}
                transparent
                opacity={0}
            />
        </mesh>
    )
}
