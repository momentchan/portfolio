import * as THREE from 'three';

/**
 * Generates a texture with random positions inside a sphere
 * @param count - Number of particles (will be rounded to nearest square)
 * @param radius - Radius of the sphere
 * @param center - Center position of the sphere
 * @param gl - WebGL renderer context
 * @returns DataTexture containing random positions inside sphere
 */
export function generateSpherePositionTexture(
    count: number,
    radius: number = 1.0,
    center: [number, number, number] = [0, 0, 0],
    gl: THREE.WebGLRenderer
): THREE.DataTexture {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    
    // Generate random positions inside sphere using rejection sampling
    for (let i = 0; i < size * size; i++) {
        let x, y, z, distance;
        
        // Use rejection sampling to get points inside sphere
        do {
            x = (Math.random() - 0.5) * 2 * radius;
            y = (Math.random() - 0.5) * 2 * radius;
            z = (Math.random() - 0.5) * 2 * radius;
            distance = Math.sqrt(x * x + y * y + z * z);
        } while (distance > radius);
        
        // Offset by center position
        x += center[0];
        y += center[1];
        z += center[2];
        
        const index = i * 4;
        data[index] = x;       // x position
        data[index + 1] = y;   // y position
        data[index + 2] = z;   // z position
        data[index + 3] = 0.0; // age (always start at 0)
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

/**
 * Generates a texture with positions distributed on sphere surface
 * @param count - Number of particles (will be rounded to nearest square)
 * @param radius - Radius of the sphere
 * @param center - Center position of the sphere
 * @param gl - WebGL renderer context
 * @returns DataTexture containing positions on sphere surface
 */
export function generateSphereSurfaceTexture(
    count: number,
    radius: number = 1.0,
    center: [number, number, number] = [0, 0, 0],
    gl: THREE.WebGLRenderer
): THREE.DataTexture {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    
    // Generate positions on sphere surface
    for (let i = 0; i < size * size; i++) {
        // Generate uniform distribution on sphere surface
        const theta = Math.random() * Math.PI * 2; // azimuthal angle
        const phi = Math.acos(2 * Math.random() - 1); // polar angle
        
        const x = Math.sin(phi) * Math.cos(theta) * radius + center[0];
        const y = Math.sin(phi) * Math.sin(theta) * radius + center[1];
        const z = Math.cos(phi) * radius + center[2];
        
        const index = i * 4;
        data[index] = x;       // x position
        data[index + 1] = y;   // y position
        data[index + 2] = z;   // z position
        data[index + 3] = 0.0; // age (always start at 0)
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
