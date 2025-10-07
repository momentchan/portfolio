import * as THREE from 'three';

/**
 * Generates a texture with random lifetime values for each particle
 * @param count - Number of particles (will be rounded to nearest square)
 * @param minLifetime - Minimum lifetime value
 * @param maxLifetime - Maximum lifetime value
 * @param gl - WebGL renderer context
 * @returns DataTexture containing random lifetime values
 */
export function generateLifetimeTexture(
    count: number,
    minLifetime: number = 1.0,
    maxLifetime: number = 5.0,
    gl: THREE.WebGLRenderer
): THREE.DataTexture {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    
    // Generate random lifetime values for each particle
    for (let i = 0; i < size * size; i++) {
        const lifetime = minLifetime + Math.random() * (maxLifetime - minLifetime);
        
        const index = i * 4;
        data[index] = lifetime;     // lifetime value
        data[index + 1] = 0.0;     // unused
        data[index + 2] = 0.0;     // unused
        data[index + 3] = 0.0;     // unused
    }
    
    // Create texture from the data
    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    
    texture.needsUpdate = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    
    return texture;
}