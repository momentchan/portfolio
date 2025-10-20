'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DynamicCamera adjusts the orthographic camera's frustum based on viewport aspect ratio
 * to handle both landscape and portrait orientations properly
 */
export default function DynamicCamera() {
    const { camera, size } = useThree();

    useEffect(() => {
        if (camera instanceof THREE.OrthographicCamera) {
            const aspect = size.width / size.height;
            const frustumSize = 20; // Total height of the view

            camera.left = -frustumSize * aspect / 2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
            camera.updateProjectionMatrix();
        }
    }, [camera, size]);

    return null;
}
