'use client';

import { useRef, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CameraControls, Environment, useFBO } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';
import Flower from './Flower';
import Model from './Model';

interface FBOSceneProps {
    width?: number;
    height?: number;
}

const FBOScene = forwardRef<{ getFBOTexture: () => THREE.Texture | null }, FBOSceneProps>(
    ({ }, ref) => {
        const { gl, size, viewport } = useThree();
        const flowerRef = useRef<THREE.Group>(null);

        // FBO setup
        const fbo = useFBO(size.width * viewport.dpr, size.height * viewport.dpr, {
            type: THREE.HalfFloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            stencilBuffer: false,
            samples: 4
        });

        // Perspective camera for rendering the flower
        const flowerCamera = useMemo(() => new THREE.PerspectiveCamera(50, 1, 0.1, 1000), []);

         // Controls
         const controls = useControls('Flower FBO', {
             flowerScale: { value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
             cameraDistance: { value: .5, min: 0.0, max: 20.0, step: 0.1 },
         });

         // Expose FBO texture via ref
         useImperativeHandle(ref, () => ({
             getFBOTexture: () => fbo.texture,
         }));

         // Force initial render to populate FBO
         useEffect(() => {
             if (flowerRef.current) {
                 // Position flower camera
                 flowerCamera.position.set(0, 0, controls.cameraDistance);
                 flowerCamera.lookAt(0, 0, 0);

                 // Render Flower to FBO immediately
                 gl.setRenderTarget(fbo);
                 gl.clear();
                 gl.render(
                     new THREE.Scene().add(flowerRef.current),
                     flowerCamera
                 );
                 gl.setRenderTarget(null);
             }
         }, [gl, fbo, flowerCamera, controls.cameraDistance]);

        useFrame((state, delta) => {
            if (!flowerRef.current) return;

            // Update flower rotation and scale
            // flowerRef.current.scale.setScalar(controls.flowerScale);

            // Position flower camera
            flowerCamera.position.set(0, 0, controls.cameraDistance);
            flowerCamera.lookAt(0, 0, 0);

            // Render Flower to FBO
            gl.setRenderTarget(fbo);
            gl.clear();
            gl.render(
                new THREE.Scene().add(flowerRef.current),
                flowerCamera
            );

            gl.setRenderTarget(null);
        });

        return (
            <group>
                {/* Flower component (rendered to FBO) */}
                <group ref={flowerRef} position={[0, 0, 0]}>
                    {/* <Flower /> */}


                    <ambientLight intensity={1} />
                    <directionalLight position={[1, 1, 1]} intensity={1} />
                    <Environment preset="studio" environmentIntensity={10} />
                    <Model path={'Astronaut.fbx'} pos={[0, -0.0, 0]} />
                </group>
            </group>
        );
    }
);

FBOScene.displayName = 'FBOScene';

export default FBOScene;