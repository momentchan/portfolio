import React, { useEffect, useRef } from 'react'

interface AutoSpawnerProps {
  isActive: boolean
  onSpawn: () => void
  minInterval?: number
  maxInterval?: number
  enabled?: boolean
}

export const AutoSpawner: React.FC<AutoSpawnerProps> = ({
  isActive,
  onSpawn,
  minInterval = 2000,
  maxInterval = 5000,
  enabled = true
}) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(!document.hidden)

  const scheduleNextSpawn = () => {
    if (!enabled || !isVisibleRef.current) return

    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }

    // Random spawn interval between min and max
    const randomDelay = Math.random() * (maxInterval - minInterval) + minInterval

    timeoutIdRef.current = setTimeout(() => {
      if (isVisibleRef.current && enabled) {
        onSpawn()
      }
      scheduleNextSpawn() // Schedule the next spawn
    }, randomDelay)
  }

  const handleVisibilityChange = () => {
    isVisibleRef.current = !document.hidden

    if (isVisibleRef.current && enabled) {
      // Browser became visible - schedule next spawn
      scheduleNextSpawn()
    } else {
      // Browser went to background - clear any pending spawns
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }

  useEffect(() => {
    if (!isActive || !enabled) {
      // Clear timeout if not active
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      return
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start the first spawn
    scheduleNextSpawn()

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, enabled, minInterval, maxInterval])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  return null // This component doesn't render anything
}
