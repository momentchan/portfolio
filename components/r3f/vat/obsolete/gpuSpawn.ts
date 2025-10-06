import * as THREE from 'three'

export interface GPUSpawnData {
  position: THREE.Vector3
  nodeId: number
}

export class GPUSpawner {
  private nodeTexture: THREE.Texture | null = null
  private gl: THREE.WebGLRenderer | null = null
  private cachedTextureData: Float32Array | null = null
  private lastReadbackTime: number = 0
  private readonly CACHE_DURATION = 100 // Cache for 100ms to avoid excessive readbacks
  
  // Performance optimizations
  private framebuffer: WebGLFramebuffer | null = null
  private readbackQueue: Array<{ resolve: (data: Float32Array | null) => void, reject: (error: Error) => void }> = []
  private isReadbackInProgress = false
  private readonly MAX_QUEUE_SIZE = 10
  private readonly READBACK_THROTTLE_MS = 16 // ~60fps max

  constructor(gl: THREE.WebGLRenderer, nodeTexture: THREE.Texture) {
    this.gl = gl
    this.nodeTexture = nodeTexture
    this.initFramebuffer()
  }

  // Initialize reusable framebuffer for better performance
  private initFramebuffer = () => {
    if (!this.gl) return
    
    const webglContext = this.gl.getContext() as WebGLRenderingContext
    if (!webglContext) return
    
    this.framebuffer = webglContext.createFramebuffer()
  }

  // Cleanup framebuffer
  private cleanup = () => {
    if (this.framebuffer && this.gl) {
      const webglContext = this.gl.getContext() as WebGLRenderingContext
      if (webglContext) {
        webglContext.deleteFramebuffer(this.framebuffer)
      }
    }
    this.framebuffer = null
  }

  // Async readback with throttling
  private asyncReadTextureToCPU = (texture: THREE.Texture): Promise<Float32Array | null> => {
    return new Promise((resolve, reject) => {
      // Throttle readback requests
      const now = Date.now()
      if (now - this.lastReadbackTime < this.READBACK_THROTTLE_MS) {
        resolve(this.cachedTextureData)
        return
      }

      // Queue management
      if (this.readbackQueue.length >= this.MAX_QUEUE_SIZE) {
        reject(new Error('Readback queue full'))
        return
      }

      this.readbackQueue.push({ resolve, reject })
      
      if (!this.isReadbackInProgress) {
        this.processReadbackQueue()
      }
    })
  }

  // Process readback queue asynchronously
  private processReadbackQueue = async () => {
    if (this.isReadbackInProgress || this.readbackQueue.length === 0) return
    
    this.isReadbackInProgress = true
    
    while (this.readbackQueue.length > 0) {
      const { resolve, reject } = this.readbackQueue.shift()!
      
      try {
        const data = await this.performReadback()
        resolve(data)
      } catch (error) {
        reject(error as Error)
      }
      
      // Allow other operations between readbacks
      await new Promise(resolve => requestAnimationFrame(resolve))
    }
    
    this.isReadbackInProgress = false
  }

  // Perform the actual readback operation
  private performReadback = (): Promise<Float32Array | null> => {
    return new Promise((resolve, reject) => {
      try {
        if (!this.nodeTexture) {
          resolve(null)
          return
        }
        const data = this.readTextureToCPUOptimized(this.nodeTexture)
        resolve(data)
      } catch (error) {
        reject(error)
      }
    })
  }

  // Optimized readback using reusable framebuffer
  private readTextureToCPUOptimized = (texture: THREE.Texture) => {
    try {
      if (!this.gl || !this.framebuffer) return null

      const webglContext = this.gl.getContext() as WebGLRenderingContext
      if (!webglContext) return null

      // Get the actual WebGL texture from Three.js texture
      let webglTexture = (texture as any).__webglTexture as WebGLTexture
      if (!webglTexture) {
        const textureProperties = (this.gl as any).properties.get(texture)
        webglTexture = textureProperties?.__webglTexture
      }
      if (!webglTexture) return null

      const width = texture.image.width
      const height = texture.image.height

      // Use reusable framebuffer
      webglContext.bindFramebuffer(webglContext.FRAMEBUFFER, this.framebuffer)
      webglContext.framebufferTexture2D(webglContext.FRAMEBUFFER, webglContext.COLOR_ATTACHMENT0, webglContext.TEXTURE_2D, webglTexture, 0)

      // Check if framebuffer is complete
      const framebufferStatus = webglContext.checkFramebufferStatus(webglContext.FRAMEBUFFER)
      if (framebufferStatus !== webglContext.FRAMEBUFFER_COMPLETE) {
        return null
      }

      // Read pixels from the texture (use Float32 for FloatType textures)
      const pixelData = new Float32Array(width * height * 4)
      webglContext.readPixels(0, 0, width, height, webglContext.RGBA, webglContext.FLOAT, pixelData)

      return pixelData
    } catch (error) {
      console.error('Error reading texture to CPU:', error)
      return null
    }
  }

  // Legacy synchronous method (kept for compatibility)
  private readTextureToCPU = (texture: THREE.Texture) => {
    return this.readTextureToCPUOptimized(texture)
  }

  // Get cached texture data or read from GPU if cache is stale
  private getTextureData = (): Float32Array | null => {
    const now = Date.now()
    
    // Return cached data if it's still fresh
    if (this.cachedTextureData && (now - this.lastReadbackTime) < this.CACHE_DURATION) {
      return this.cachedTextureData
    }

    // Read fresh data from GPU
    if (!this.nodeTexture) return null
    
    const freshData = this.readTextureToCPU(this.nodeTexture)
    if (freshData) {
      this.cachedTextureData = freshData
      this.lastReadbackTime = now
    }
    
    return freshData
  }

  // Async version for non-blocking readback
  private getTextureDataAsync = async (): Promise<Float32Array | null> => {
    const now = Date.now()
    
    // Return cached data if it's still fresh
    if (this.cachedTextureData && (now - this.lastReadbackTime) < this.CACHE_DURATION) {
      return this.cachedTextureData
    }

    // Read fresh data from GPU asynchronously
    if (!this.nodeTexture) return null
    
    const freshData = await this.asyncReadTextureToCPU(this.nodeTexture)
    if (freshData) {
      this.cachedTextureData = freshData
      this.lastReadbackTime = now
    }
    
    return freshData
  }

  // Function to get position of a specific node given trail and node ID
  getNodePosition = (trailId: number, nodeId: number) => {
    if (!this.nodeTexture) {
      console.warn('No node texture available')
      return null
    }

    const width = this.nodeTexture.image.width  // nodesPerTrail
    const height = this.nodeTexture.image.height // trailsNum

    // Validate indices
    if (trailId < 0 || trailId >= height) {
      console.warn(`Invalid trail ID: ${trailId}. Must be between 0 and ${height - 1}`)
      return null
    }

    if (nodeId < 0 || nodeId >= width) {
      console.warn(`Invalid node ID: ${nodeId}. Must be between 0 and ${width - 1}`)
      return null
    }

    const textureData = this.getTextureData()

    if (!textureData) {
      return null
    }

    // Calculate pixel index in the flat array
    // Texture layout: [nodeId][trailId] = [x][y]
    const pixelIndex = (trailId * width + nodeId) * 4

    // Extract position data (RGBA format)
    const position = {
      x: textureData[pixelIndex],     // R channel = X position
      y: textureData[pixelIndex + 1], // G channel = Y position  
      z: textureData[pixelIndex + 2], // B channel = Z position
      time: textureData[pixelIndex + 3] // A channel = Time
    }

    return position
  }

  // Get spawn data for a specific node
  getSpawnData = (trailId: number, nodeId: number): GPUSpawnData | null => {
    const position = this.getNodePosition(trailId, nodeId)
    if (!position) return null

    return {
      position: new THREE.Vector3(position.x, position.y, position.z),
      nodeId
    }
  }

  // Async version for non-blocking spawn data retrieval
  getSpawnDataAsync = async (trailId: number, nodeId: number): Promise<GPUSpawnData | null> => {
    const position = await this.getNodePositionAsync(trailId, nodeId)
    if (!position) return null

    return {
      position: new THREE.Vector3(position.x, position.y, position.z),
      nodeId
    }
  }

  // Async version of getNodePosition
  getNodePositionAsync = async (trailId: number, nodeId: number) => {
    if (!this.nodeTexture) {
      console.warn('No node texture available')
      return null
    }

    const width = this.nodeTexture.image.width  // nodesPerTrail
    const height = this.nodeTexture.image.height // trailsNum

    // Validate indices
    if (trailId < 0 || trailId >= height) {
      console.warn(`Invalid trail ID: ${trailId}. Must be between 0 and ${height - 1}`)
      return null
    }

    if (nodeId < 0 || nodeId >= width) {
      console.warn(`Invalid node ID: ${nodeId}. Must be between 0 and ${width - 1}`)
      return null
    }

    const textureData = await this.getTextureDataAsync()

    if (!textureData) {
      return null
    }

    // Calculate pixel index in the flat array
    // Texture layout: [nodeId][trailId] = [x][y]
    const pixelIndex = (trailId * width + nodeId) * 4

    // Extract position data (RGBA format)
    const position = {
      x: textureData[pixelIndex],     // R channel = X position
      y: textureData[pixelIndex + 1], // G channel = Y position  
      z: textureData[pixelIndex + 2], // B channel = Z position
      time: textureData[pixelIndex + 3] // A channel = Time
    }

    return position
  }

  // Update the node texture (for when it changes)
  updateNodeTexture = (nodeTexture: THREE.Texture) => {
    this.nodeTexture = nodeTexture
  }

  // Update the WebGL renderer (for when it changes)
  updateRenderer = (gl: THREE.WebGLRenderer) => {
    this.gl = gl
  }

  // Get all cached texture data (useful for batch operations)
  getAllTextureData = (): Float32Array | null => {
    return this.getTextureData()
  }

  // Get texture dimensions
  getTextureDimensions = () => {
    if (!this.nodeTexture) return null
    return {
      width: this.nodeTexture.image.width,
      height: this.nodeTexture.image.height
    }
  }

  // Force refresh of cached data
  refreshTextureData = () => {
    this.cachedTextureData = null
    this.lastReadbackTime = 0
    return this.getTextureData()
  }

  // Check if cached data is available and fresh
  hasCachedData = (): boolean => {
    const now = Date.now()
    return !!(this.cachedTextureData && (now - this.lastReadbackTime) < this.CACHE_DURATION)
  }

  // Cleanup resources when done
  dispose = () => {
    this.cleanup()
    this.readbackQueue = []
    this.cachedTextureData = null
    this.nodeTexture = null
    this.gl = null
  }

  // Partial readback for specific regions (for even better performance)
  readPartialTextureData = (x: number, y: number, width: number, height: number): Float32Array | null => {
    try {
      if (!this.gl || !this.framebuffer) return null

      const webglContext = this.gl.getContext() as WebGLRenderingContext
      if (!webglContext) return null

      // Get the actual WebGL texture from Three.js texture
      let webglTexture = (this.nodeTexture as any).__webglTexture as WebGLTexture
      if (!webglTexture) {
        const textureProperties = (this.gl as any).properties.get(this.nodeTexture)
        webglTexture = textureProperties?.__webglTexture
      }
      if (!webglTexture) return null

      // Use reusable framebuffer
      webglContext.bindFramebuffer(webglContext.FRAMEBUFFER, this.framebuffer)
      webglContext.framebufferTexture2D(webglContext.FRAMEBUFFER, webglContext.COLOR_ATTACHMENT0, webglContext.TEXTURE_2D, webglTexture, 0)

      // Check if framebuffer is complete
      const framebufferStatus = webglContext.checkFramebufferStatus(webglContext.FRAMEBUFFER)
      if (framebufferStatus !== webglContext.FRAMEBUFFER_COMPLETE) {
        return null
      }

      // Read only the specified region
      const pixelData = new Float32Array(width * height * 4)
      webglContext.readPixels(x, y, width, height, webglContext.RGBA, webglContext.FLOAT, pixelData)

      return pixelData
    } catch (error) {
      console.error('Error reading partial texture data:', error)
      return null
    }
  }
}
