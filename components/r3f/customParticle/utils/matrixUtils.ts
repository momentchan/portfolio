import * as THREE from 'three';

/**
 * Calculate model-view-projection matrix and its inverse
 */
export function calculateMVPMatrices(
    modelMatrix: THREE.Matrix4,
    camera: THREE.Camera
): {
    modelViewProjectionMatrix: THREE.Matrix4;
    inverseModelViewProjectionMatrix: THREE.Matrix4;
} {
    const viewMatrix = camera.matrixWorldInverse;
    const projectionMatrix = camera.projectionMatrix;

    const modelViewProjectionMatrix = new THREE.Matrix4().multiplyMatrices(
        projectionMatrix,
        new THREE.Matrix4().multiplyMatrices(viewMatrix, modelMatrix)
    );
    
    const inverseModelViewProjectionMatrix = modelViewProjectionMatrix.clone().invert();

    return {
        modelViewProjectionMatrix,
        inverseModelViewProjectionMatrix
    };
}

/**
 * Get model matrix from particle system ref
 */
export function getModelMatrix(particleSystemRef: any): THREE.Matrix4 {
    return particleSystemRef.current?.getMeshRef()?.matrixWorld || new THREE.Matrix4();
}

