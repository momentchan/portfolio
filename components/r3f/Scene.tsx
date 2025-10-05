'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { CameraControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import EnvironmentSetup from './EnvironmentSetup';
import Effects from './Effects';
import LevaWraper from '../../lib/r3f-gist/utility/LevaWraper';
import { CustomTrail } from './customTrail/CustomTrail';
import { VATMeshSpawner } from './vat/VATMeshSpawner';
import CameraRotator from './CameraRotator';
import DirectionalLights from './DirectionalLights';
import { TrailProvider } from './contexts/TrailContext';

export default function Scene() {

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LevaWraper initialHidden={true} />
      <TrailProvider>
        <Canvas
          shadows
          gl={{ shadowMapType: THREE.PCFSoftShadowMap }}
        >
          <color attach="background" args={['#000000']} />

          <PerspectiveCamera
            makeDefault
            position={[0, 0, 0.75]}
            zoom={1}
            near={0.01}
            far={5}
            fov={60}
          />

          <CameraRotator />
          <CameraControls />
          <EnvironmentSetup />
          <CustomTrail />
          <DirectionalLights />
          <Effects />
          <VATMeshSpawner vatData={{
            gltfPath: "vat/Dahlia Clean_basisMesh.gltf",
            posTexPath: "vat/Dahlia Clean_pos.exr",
            nrmTexPath: "vat/Dahlia Clean_nrm.png",
            mapTexPath: "textures/tujlip.png",
            maskTexPath: "textures/blackanedwthioe.png",
            metaPath: "vat/Dahlia Clean_meta.json"
          }} />
        </Canvas>
      </TrailProvider>
    </div >
  );
}
