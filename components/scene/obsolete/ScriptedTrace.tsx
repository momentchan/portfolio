'use client';

import { useRef, useMemo, forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import * as THREE from 'three';
import { useControls } from 'leva';

// ===== TYPES =====
interface ScriptedTraceProps {
  width?: number;
  height?: number;
  showDebug?: boolean;
  downsample?: number;
}

interface ScriptedTraceRef {
  getFBOTexture: () => THREE.Texture | null;
}

// ===== CONSTANTS =====
const DEFAULT_VALUES = {
  diffusion: 0.05,
  fadeSpeed: 0.98,
  curl: 1,
  traceOpacity: 0.8,
  minOpacity: 0.0,
  maxOpacity: 1.0,
  growTime: 1.0,
  stayTime: 1.0,
  shrinkTime: 1.0,
  disappearTime: 1.0,
  teleportDistance: 1.2,
  teleportJump: 0.1,
  rotationSpeed: 0.15,
  flashIntensity: 0.7,
  objectSize: 0.15,
  objectColor: new THREE.Vector3(1, 0.7, 0.7)
};


// ===== SHADERS =====
const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */`
  // ===== UNIFORMS =====
  // Time and delta
  uniform float uTime;
  uniform float uDeltaTime;
  
  // Fluid simulation parameters
  uniform float uDiffusion;
  uniform float uFadeSpeed;
  uniform float uCurl;
  uniform sampler2D uPreviousTexture;
  
  // Object parameters
  uniform float uObjectSize;
  uniform vec3 uObjectColor;
  uniform float uTraceOpacity;
  uniform float uAspect;
  
  // Pulsing animation controls
  uniform float uMinOpacity;
  uniform float uMaxOpacity;
  uniform float uGrowTime;
  uniform float uStayTime;
  uniform float uShrinkTime;
  uniform float uDisappearTime;
  
  // Teleportation effect controls
  uniform float uTeleportDistance;
  uniform float uTeleportJump;
  uniform float uRotationSpeed;
  uniform float uFlashIntensity;
  
  varying vec2 vUv;
  
  // 3D Curl noise function
  vec3 curlNoise(vec3 p) {
    float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    
    // Sample the scalar field at 6 points around p
    float p_x0 = sin(p.x - dx.x) + sin(p.y - dx.y) + sin(p.z - dx.z);
    float p_x1 = sin(p.x + dx.x) + sin(p.y + dx.y) + sin(p.z + dx.z);
    float p_y0 = sin(p.x - dy.x) + sin(p.y - dy.y) + sin(p.z - dy.z);
    float p_y1 = sin(p.x + dy.x) + sin(p.y + dy.y) + sin(p.z + dy.z);
    float p_z0 = sin(p.x - dz.x) + sin(p.y - dz.y) + sin(p.z - dz.z);
    float p_z1 = sin(p.x + dz.x) + sin(p.y + dz.y) + sin(p.z + dz.z);
    
    // Calculate 3D curl components
    float x = (p_z1 - p_z0) / (2.0 * e) - (p_y1 - p_y0) / (2.0 * e);
    float y = (p_x1 - p_x0) / (2.0 * e) - (p_z1 - p_z0) / (2.0 * e);
    float z = (p_y1 - p_y0) / (2.0 * e) - (p_x1 - p_x0) / (2.0 * e);
    
    return vec3(x, y, z);
  }
  
  void main() {
    vec2 uv = vUv;
    vec4 previous = texture2D(uPreviousTexture, uv);
    
    // ===== FLUID SIMULATION =====
    // Apply diffusion to create fluid-like behavior
    vec2 texelSize = 1.0 / vec2(512.0, 512.0);
    vec4 diffusion = vec4(0.0);
    diffusion += texture2D(uPreviousTexture, uv + vec2(texelSize.x, 0.0)) * 0.1;
    diffusion += texture2D(uPreviousTexture, uv - vec2(texelSize.x, 0.0)) * 0.1;
    diffusion += texture2D(uPreviousTexture, uv + vec2(0.0, texelSize.y)) * 0.1;
    diffusion += texture2D(uPreviousTexture, uv - vec2(0.0, texelSize.y)) * 0.1;
    diffusion += previous * 0.6;
    
    vec4 fluid = mix(previous, diffusion, uDiffusion * 0.5);
    
    // ===== CURL FORCES =====
    // Apply 3D curl forces only around the object
    vec3 curlPos = vec3(uv * 1.0, uTime * 0.5);
    vec3 curl = curlNoise(curlPos) * uCurl;
    
    // ===== OBJECT POSITION CALCULATION =====
    // Calculate animated object position with teleportation effect
    float posTotalCycleTime = uGrowTime + uStayTime + uShrinkTime + uDisappearTime;
    float posCycleTime = uTime * 0.5;
    float posPhase = mod(posCycleTime, posTotalCycleTime);
    
    // Count completed cycles for teleportation offset
    float completedCycles = floor(posCycleTime / posTotalCycleTime);
    float teleportOffset = completedCycles * uTeleportDistance; // Jump forward each cycle
    
    // Add teleportation "jump" effect - make it more dramatic
    float teleportJump = sin(completedCycles * 3.14159) * uTeleportJump; // Oscillating jump effect
    
    // Base circular motion with teleportation (aspect ratio corrected)
    float baseAngle = uTime * uRotationSpeed + teleportOffset; // Configurable rotation speed
    vec2 objectPosition = vec2(0.5 + 0.25 * cos(baseAngle), 0.5 + 0.25 * sin(baseAngle));
    
    // Apply aspect ratio correction to position to ensure circular motion
    objectPosition.x = 0.5 + (objectPosition.x - 0.5) / uAspect;
    
    // Add teleportation jump to position
    objectPosition += vec2(teleportJump, teleportJump * 0.5);
    
    // Calculate distance to object for curl falloff
    vec2 curlAspectUV = uv;
    curlAspectUV.x *= uAspect;
    vec2 curlAspectPos = objectPosition;
    curlAspectPos.x *= uAspect; // Apply aspect ratio to position for distance calculation
    float distToObject = distance(curlAspectUV, curlAspectPos);
    
    // ===== CURL INFLUENCE CALCULATION =====
    // Curl only affects area around object (within 2x object size)
    // Use the same pulsing opacity for curl influence
    float curlTotalCycleTime = uGrowTime + uStayTime + uShrinkTime + uDisappearTime;
    float curlCycleTime = uTime * 0.5;
    float curlPhase = mod(curlCycleTime, curlTotalCycleTime);
    
    float curlPulseOpacity;
    if (curlPhase < uGrowTime) {
      curlPulseOpacity = uMinOpacity + (uMaxOpacity - uMinOpacity) * smoothstep(0.0, uGrowTime, curlPhase);
    } else if (curlPhase < uGrowTime + uStayTime) {
      curlPulseOpacity = uMaxOpacity;
    } else if (curlPhase < uGrowTime + uStayTime + uShrinkTime) {
      float curlShrinkPhase = curlPhase - (uGrowTime + uStayTime);
      curlPulseOpacity = uMaxOpacity - (uMaxOpacity - uMinOpacity) * smoothstep(0.0, uShrinkTime, curlShrinkPhase);
    } else {
      curlPulseOpacity = uMinOpacity;
    }
    
    float curlInfluence = 1.0 - smoothstep(0.0, uObjectSize * 2.0, distToObject);
    curlInfluence = pow(curlInfluence, 1.5); // Sharper falloff
    curlInfluence *= curlPulseOpacity; // Apply opacity pulsing
    
    fluid.xyz += curl * uDeltaTime * curlInfluence;
    
    // ===== TRACE OBJECT RENDERING =====
    // Add single trace object
    vec4 traceInput = vec4(0.0);
    
    // Correct for aspect ratio to make circle round
    vec2 aspectCorrectedUV = uv;
    aspectCorrectedUV.x *= uAspect;
    vec2 aspectCorrectedPos = objectPosition;
    aspectCorrectedPos.x *= uAspect;
    
    // Pulsing opacity with customizable phases: grow → stay → shrink → disappear
    float totalCycleTime = uGrowTime + uStayTime + uShrinkTime + uDisappearTime;
    float cycleTime = uTime * 0.5;
    float phase = mod(cycleTime, totalCycleTime);
    
    float pulseOpacity;
    if (phase < uGrowTime) {
      // Phase 1: Fade in from min to max opacity
      pulseOpacity = uMinOpacity + (uMaxOpacity - uMinOpacity) * smoothstep(0.0, uGrowTime, phase);
    } else if (phase < uGrowTime + uStayTime) {
      // Phase 2: Stay at max opacity
      pulseOpacity = uMaxOpacity;
    } else if (phase < uGrowTime + uStayTime + uShrinkTime) {
      // Phase 3: Fade out from max to min opacity
      float shrinkPhase = phase - (uGrowTime + uStayTime);
      pulseOpacity = uMaxOpacity - (uMaxOpacity - uMinOpacity) * smoothstep(0.0, uShrinkTime, shrinkPhase);
    } else {
      // Phase 4: Disappear (min opacity)
      pulseOpacity = uMinOpacity;
    }
    
    float dist = distance(aspectCorrectedUV, aspectCorrectedPos);
    float influence = 1.0 - smoothstep(0.0, uObjectSize * 0.8, dist);
    influence = pow(influence, 2.0); // Sharper falloff
    influence *= pulseOpacity; // Apply opacity pulsing
    
    if (influence > 0.0) {
      // Add teleportation visual effect - flash white during teleportation
      float teleportFlash = sin(completedCycles * 6.28318 + uTime * 10.0) * 0.5 + 0.5;
      teleportFlash = pow(teleportFlash, 3.0); // Sharper flash
      
      // Mix object color with white flash during teleportation
      vec3 flashColor = mix(vec3(uObjectColor), vec3(1.0, 1.0, 1.0), teleportFlash * uFlashIntensity);
      
      traceInput.rgb = flashColor * influence * uTraceOpacity;
      traceInput.a = influence * uTraceOpacity;
    }
    
    // ===== FINAL COMPOSITION =====
    // Combine fluid with trace input
    vec4 result = fluid + traceInput;
    
    // Apply fade to create trailing effect
    result *= uFadeSpeed;
    
    gl_FragColor = clamp(result, 0.0, 1.0);
  }
`;

const debugVertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const debugFragmentShader = /* glsl */`
  uniform sampler2D uTexture;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = vec4(color.rgb, uOpacity);
  }
`;

/**
 * Scripted Trace FBO component with ping-pong FBO shader system
 * 
 * Features:
 * - Fluid simulation with diffusion and curl forces
 * - Animated scripted trace objects with teleportation
 * - Pulsing opacity animation (grow → stay → shrink → disappear)
 * - Ping-pong FBO rendering for smooth accumulation
 * - Real-time Leva controls for all parameters
 * 
 * @param showDebug - Whether to show debug quad
 * @param downsample - FBO resolution downsampling factor
 */
const ScriptedTrace = forwardRef<ScriptedTraceRef, ScriptedTraceProps>(({ 
  showDebug = true, 
  downsample = 1 
}, ref) => {
  // ===== HOOKS =====
  const { gl, size } = useThree();

  // ===== STATE MANAGEMENT =====
  const readIndex = useRef(0);
  const writeIndex = useRef(1);
  const debugMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  // ===== PING-PONG FBO MANAGEMENT =====
  const swapFBOs = useCallback(() => {
    const temp = readIndex.current;
    readIndex.current = writeIndex.current;
    writeIndex.current = temp;
  }, []);

  // ===== FBO SETUP =====
  const fboA = useFBO(
    Math.floor(size.width / downsample),
    Math.floor(size.height / downsample),
    {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }
  );

  const fboB = useFBO(
    Math.floor(size.width / downsample),
    Math.floor(size.height / downsample),
    {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    }
  );

  const fbos = [fboA, fboB];

  // ===== CONTROLS =====
  const controls = useControls('Scripted Trace FBO', {
    // Fluid parameters
    diffusion: { value: DEFAULT_VALUES.diffusion, min: 0.0, max: 1.0, step: 0.01 },
    fadeSpeed: { value: DEFAULT_VALUES.fadeSpeed, min: 0.9, max: 1.0, step: 0.001 },
    curl: { value: DEFAULT_VALUES.curl, min: 0.0, max: 1.0, step: 0.01 },
    
    // Trace parameters
    traceOpacity: { value: DEFAULT_VALUES.traceOpacity, min: 0.0, max: 1.0, step: 0.01 },
    
    // Pulsing controls
    minOpacity: { value: DEFAULT_VALUES.minOpacity, min: 0.0, max: 1.0, step: 0.01 },
    maxOpacity: { value: DEFAULT_VALUES.maxOpacity, min: 0.0, max: 1.0, step: 0.01 },
    growTime: { value: DEFAULT_VALUES.growTime, min: 0.1, max: 5.0, step: 0.1 },
    stayTime: { value: DEFAULT_VALUES.stayTime, min: 0.1, max: 5.0, step: 0.1 },
    shrinkTime: { value: DEFAULT_VALUES.shrinkTime, min: 0.1, max: 5.0, step: 0.1 },
    disappearTime: { value: DEFAULT_VALUES.disappearTime, min: 0.1, max: 5.0, step: 0.1 },
    
    // Teleportation controls
    teleportDistance: { value: DEFAULT_VALUES.teleportDistance, min: 0.0, max: 3.0, step: 0.1 },
    teleportJump: { value: DEFAULT_VALUES.teleportJump, min: 0.0, max: 0.5, step: 0.01 },
    rotationSpeed: { value: DEFAULT_VALUES.rotationSpeed, min: 0.01, max: 0.5, step: 0.01 },
    flashIntensity: { value: DEFAULT_VALUES.flashIntensity, min: 0.0, max: 1.0, step: 0.01 },
    
    // Debug
    showDebug: { value: showDebug },
  });

  // ===== MATERIALS =====
  const pingPongMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uDeltaTime: { value: 0.0 },
        uDiffusion: { value: DEFAULT_VALUES.diffusion },
        uFadeSpeed: { value: DEFAULT_VALUES.fadeSpeed },
        uTraceOpacity: { value: DEFAULT_VALUES.traceOpacity },
        uCurl: { value: DEFAULT_VALUES.curl },
        uPreviousTexture: { value: null },
        uObjectSize: { value: DEFAULT_VALUES.objectSize },
        uObjectColor: { value: DEFAULT_VALUES.objectColor.clone() },
        uAspect: { value: 1.0 },
        uMinOpacity: { value: DEFAULT_VALUES.minOpacity },
        uMaxOpacity: { value: DEFAULT_VALUES.maxOpacity },
        uGrowTime: { value: DEFAULT_VALUES.growTime },
        uStayTime: { value: DEFAULT_VALUES.stayTime },
        uShrinkTime: { value: DEFAULT_VALUES.shrinkTime },
        uDisappearTime: { value: DEFAULT_VALUES.disappearTime },
        uTeleportDistance: { value: DEFAULT_VALUES.teleportDistance },
        uTeleportJump: { value: DEFAULT_VALUES.teleportJump },
        uRotationSpeed: { value: DEFAULT_VALUES.rotationSpeed },
        uFlashIntensity: { value: DEFAULT_VALUES.flashIntensity },
      },
      blending: THREE.NoBlending,
    });
  }, []);

  // ===== SIMULATION SETUP =====
  const simulationScene = useMemo(() => new THREE.Scene(), []);
  const simulationCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const simulationQuad = useMemo(() => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pingPongMaterial);
    mesh.frustumCulled = false;
    return mesh;
  }, [pingPongMaterial]);

  // ===== EFFECTS =====
  useEffect(() => {
    simulationScene.add(simulationQuad);
    return () => {
      simulationScene.remove(simulationQuad);
    };
  }, [simulationScene, simulationQuad]);

  // ===== INITIALIZATION =====
  // Initialize FBOs
  useEffect(() => {
    const previousColor = new THREE.Color();
    gl.getClearColor(previousColor);
    const previousAlpha = gl.getClearAlpha();

    gl.setClearColor(new THREE.Color(0, 0, 0), 1);
    [fboA, fboB].forEach((renderTarget) => {
      gl.setRenderTarget(renderTarget);
      gl.clear(true, true, true);
    });
    gl.setRenderTarget(null);

    gl.setClearColor(previousColor, previousAlpha);
  }, [gl, fboA, fboB]);

  // ===== RENDER LOOP =====
  useFrame((state, delta) => {
    const currentTime = state.clock.elapsedTime;
    const deltaTime = delta;

    // ===== UNIFORM UPDATES =====
    const uniforms = pingPongMaterial.uniforms;
    
    // Time uniforms
    uniforms.uTime.value = currentTime;
    uniforms.uDeltaTime.value = deltaTime;

    // Fluid simulation uniforms
    uniforms.uDiffusion.value = controls.diffusion;
    uniforms.uFadeSpeed.value = controls.fadeSpeed;
    uniforms.uCurl.value = controls.curl;
    uniforms.uAspect.value = size.width / size.height;
    
    // Trace object uniforms
    uniforms.uTraceOpacity.value = controls.traceOpacity;
    uniforms.uObjectSize.value = DEFAULT_VALUES.objectSize; // Base size - shader handles pulsing
    uniforms.uObjectColor.value.set(DEFAULT_VALUES.objectColor.x, DEFAULT_VALUES.objectColor.y, DEFAULT_VALUES.objectColor.z);
    
    // Pulsing animation uniforms
    uniforms.uMinOpacity.value = controls.minOpacity;
    uniforms.uMaxOpacity.value = controls.maxOpacity;
    uniforms.uGrowTime.value = controls.growTime;
    uniforms.uStayTime.value = controls.stayTime;
    uniforms.uShrinkTime.value = controls.shrinkTime;
    uniforms.uDisappearTime.value = controls.disappearTime;
    
    // Teleportation effect uniforms
    uniforms.uTeleportDistance.value = controls.teleportDistance;
    uniforms.uTeleportJump.value = controls.teleportJump;
    uniforms.uRotationSpeed.value = controls.rotationSpeed;
    uniforms.uFlashIntensity.value = controls.flashIntensity;

    // ===== PING-PONG RENDERING =====
    // Set previous texture (read from current read buffer)
    uniforms.uPreviousTexture.value = fbos[readIndex.current].texture;

    // Render to write buffer
    gl.setRenderTarget(fbos[writeIndex.current]);
    gl.render(simulationScene, simulationCamera);
    gl.setRenderTarget(null);

    // Swap read/write buffers after rendering
    swapFBOs();

    // ===== DEBUG UPDATE =====
    // Update debug material to show latest result
    if (debugMaterialRef.current) {
      debugMaterialRef.current.uniforms.uTexture.value = fbos[readIndex.current].texture;
    }
  });

  // ===== REF HANDLING =====
  useImperativeHandle(ref, () => ({
    getFBOTexture: () => fbos[readIndex.current].texture,
  }));

  // ===== RENDER =====
  return (
    <group>
      {controls.showDebug && (
        <mesh position={[0, 0, -1]}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            ref={debugMaterialRef}
            vertexShader={debugVertexShader}
            fragmentShader={debugFragmentShader}
            uniforms={{
              uTexture: { value: null },
              uOpacity: { value: 1 }
            }}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});

ScriptedTrace.displayName = 'ScriptedTrace';

export default ScriptedTrace;
