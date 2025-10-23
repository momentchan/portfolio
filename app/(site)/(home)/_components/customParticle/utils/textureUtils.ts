import * as THREE from 'three';
import { VATMetadata } from '../types';

/**
 * Generate random vertex IDs for particle-to-vertex mapping
 */
export function generateRandomVertexIds(
    particleCount: number,
    maxVertexCount: number
): Uint32Array {
    const size = Math.floor(Math.sqrt(particleCount));
    const ids = new Uint32Array(size * size);
    
    for (let i = 0; i < size * size; i++) {
        ids[i] = Math.floor(Math.random() * maxVertexCount);
    }
    
    return ids;
}

/**
 * Generate base position texture from mesh geometry
 */
export function generateBasePosTexture(
    count: number,
    geometry: THREE.BufferGeometry,
    randomIds: Uint32Array
): THREE.DataTexture {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);
    const positions = geometry.getAttribute('position');

    for (let i = 0; i < size * size; i++) {
        const vatId = randomIds[i];
        const x = positions.getX(vatId);
        const y = positions.getY(vatId);
        const z = positions.getZ(vatId);

        const index = i * 4;
        data[index] = x;
        data[index + 1] = y;
        data[index + 2] = z;
        data[index + 3] = 0;
    }

    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    texture.needsUpdate = true;
    
    return texture;
}

/**
 * Generate UV2 texture for VAT mapping
 */
export function generateUV2Texture(
    count: number,
    meta: VATMetadata,
    randomIds: Uint32Array
): THREE.DataTexture {
    const size = Math.floor(Math.sqrt(count));
    const data = new Float32Array(size * size * 4);

    for (let i = 0; i < size * size; i++) {
        const vatId = randomIds[i];

        // Calculate UV2 coordinates based on VAT vertex ID
        const colIndex = Math.floor(vatId / meta.texHeight);
        const vIndex = vatId % meta.texHeight;
        const px = colIndex * meta.frameStride;
        const py = vIndex;
        const u = (px + 0.5) / meta.texWidth;
        const v = (py + 0.5) / meta.texHeight;

        const index = i * 4;
        data[index] = u;     // UV2 U coordinate
        data[index + 1] = v; // UV2 V coordinate
        data[index + 2] = 0; // Unused
        data[index + 3] = 0; // Unused
    }

    const texture = new THREE.DataTexture(
        data,
        size,
        size,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    
    return texture;
}

