import * as THREE from 'three'

export interface GPUSpawnData {
  position: THREE.Vector3
  nodeId: number
}

export class GPUSpawner {
  private nodeTexture: THREE.Texture | null = null
  private gl: THREE.WebGLRenderer | null = null

  constructor(gl: THREE.WebGLRenderer, nodeTexture: THREE.Texture) {
    this.gl = gl
    this.nodeTexture = nodeTexture
  }

  // Function to read texture data from GPU to CPU using WebGL readPixels
  private readTextureToCPU = (texture: THREE.Texture) => {
    try {
      if (!this.gl) return null

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

      // Create a framebuffer to read from the texture
      const framebuffer = webglContext.createFramebuffer()
      if (!framebuffer) return null

      webglContext.bindFramebuffer(webglContext.FRAMEBUFFER, framebuffer)
      webglContext.framebufferTexture2D(webglContext.FRAMEBUFFER, webglContext.COLOR_ATTACHMENT0, webglContext.TEXTURE_2D, webglTexture, 0)

      // Check if framebuffer is complete
      const framebufferStatus = webglContext.checkFramebufferStatus(webglContext.FRAMEBUFFER)
      if (framebufferStatus !== webglContext.FRAMEBUFFER_COMPLETE) {
        webglContext.deleteFramebuffer(framebuffer)
        return null
      }

      // Read pixels from the texture (use Float32 for FloatType textures)
      const pixelData = new Float32Array(width * height * 4)
      webglContext.readPixels(0, 0, width, height, webglContext.RGBA, webglContext.FLOAT, pixelData)

      // Clean up
      webglContext.deleteFramebuffer(framebuffer)

      return pixelData
    } catch (error) {
      console.error('Error reading texture to CPU:', error)
      return null
    }
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

    const textureData = this.readTextureToCPU(this.nodeTexture)

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

  // Update the node texture (for when it changes)
  updateNodeTexture = (nodeTexture: THREE.Texture) => {
    this.nodeTexture = nodeTexture
  }

  // Update the WebGL renderer (for when it changes)
  updateRenderer = (gl: THREE.WebGLRenderer) => {
    this.gl = gl
  }
}
