import React, { useEffect, useRef } from 'react'

interface AutoSpawnerProps {
  isActive: boolean
  onSpawn: () => void
  minInterval?: number
  maxInterval?: number
  enabled?: boolean
  burstEnabled?: boolean
  burstInterval?: [number, number] // [min, max] seconds between bursts
  burstCount?: [number, number] // [min, max] number of VATs per burst
  burstDuration?: number // Duration in seconds to spawn all burst VATs
  initialDelay?: number // Delay before first spawn in milliseconds
}

export const AutoSpawner: React.FC<AutoSpawnerProps> = ({
  isActive,
  onSpawn,
  minInterval = 2000,
  maxInterval = 5000,
  enabled = true,
  burstEnabled = true,
  burstInterval = [25000, 30000], // 25-30 seconds
  burstCount = [10, 15], // 10-15 VATs
  burstDuration = 5000, // 5 seconds
  initialDelay = 0 // No delay by default
}) => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const burstTimeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const burstSpawnTimeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(!document.hidden)
  const hasStartedRef = useRef(false)

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

  const scheduleNextBurst = () => {
    if (!burstEnabled || !enabled || !isVisibleRef.current) return

    // Clear any existing burst timeout
    if (burstTimeoutIdRef.current) {
      clearTimeout(burstTimeoutIdRef.current)
    }

    // Random burst interval between min and max
    const randomBurstDelay = Math.random() * (burstInterval[1] - burstInterval[0]) + burstInterval[0]

    burstTimeoutIdRef.current = setTimeout(() => {
      if (isVisibleRef.current && enabled) {
        executeBurst()
      }
      scheduleNextBurst() // Schedule the next burst
    }, randomBurstDelay)
  }

  const executeBurst = () => {
    if (!isVisibleRef.current || !enabled) return

    // Random number of VATs to spawn in this burst
    const vatCount = Math.floor(Math.random() * (burstCount[1] - burstCount[0] + 1)) + burstCount[0]

    // Calculate spawn interval for the burst
    const spawnInterval = burstDuration / vatCount

    let spawnedCount = 0
    const burstSpawn = () => {
      if (spawnedCount < vatCount && isVisibleRef.current && enabled) {
        onSpawn()
        spawnedCount++
        
        if (spawnedCount < vatCount) {
          burstSpawnTimeoutIdRef.current = setTimeout(burstSpawn, spawnInterval)
        }
      }
    }

    // Start the burst
    burstSpawn()
  }

  const handleVisibilityChange = () => {
    isVisibleRef.current = !document.hidden

    if (isVisibleRef.current && enabled) {
      // Browser became visible - schedule next spawn and burst
      scheduleNextSpawn()
      scheduleNextBurst()
    } else {
      // Browser went to background - clear any pending spawns
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      if (burstTimeoutIdRef.current) {
        clearTimeout(burstTimeoutIdRef.current)
        burstTimeoutIdRef.current = null
      }
      if (burstSpawnTimeoutIdRef.current) {
        clearTimeout(burstSpawnTimeoutIdRef.current)
        burstSpawnTimeoutIdRef.current = null
      }
    }
  }

  useEffect(() => {
    if (!isActive || !enabled) {
      // Clear timeouts if not active
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
      if (burstTimeoutIdRef.current) {
        clearTimeout(burstTimeoutIdRef.current)
        burstTimeoutIdRef.current = null
      }
      if (burstSpawnTimeoutIdRef.current) {
        clearTimeout(burstSpawnTimeoutIdRef.current)
        burstSpawnTimeoutIdRef.current = null
      }
      return
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start the first spawn and burst with initial delay
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      
      if (initialDelay > 0) {
        setTimeout(() => {
          scheduleNextSpawn()
          scheduleNextBurst()
        }, initialDelay)
      } else {
        scheduleNextSpawn()
        scheduleNextBurst()
      }
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (burstTimeoutIdRef.current) {
        clearTimeout(burstTimeoutIdRef.current)
      }
      if (burstSpawnTimeoutIdRef.current) {
        clearTimeout(burstSpawnTimeoutIdRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, enabled, minInterval, maxInterval, burstEnabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (burstTimeoutIdRef.current) {
        clearTimeout(burstTimeoutIdRef.current)
      }
      if (burstSpawnTimeoutIdRef.current) {
        clearTimeout(burstSpawnTimeoutIdRef.current)
      }
    }
  }, [])

  return null // This component doesn't render anything
}
