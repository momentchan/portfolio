import React, { useMemo, useRef, useEffect } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import GlobalState from '../common/GlobalStates';

const fragmentShader = /* glsl */`
uniform float uBlurAmount;
uniform vec2 uResolution;

// Gaussian blur function
vec4 blur(sampler2D image, vec2 uv, vec2 resolution, vec2 direction, float amount) {
  vec4 color = vec4(0.0);
  vec2 offset = direction / resolution * amount;
  
  // 9-tap Gaussian blur
  color += texture2D(image, uv + offset * -4.0) * 0.051;
  color += texture2D(image, uv + offset * -3.0) * 0.0918;
  color += texture2D(image, uv + offset * -2.0) * 0.12245;
  color += texture2D(image, uv + offset * -1.0) * 0.1531;
  color += texture2D(image, uv + offset *  0.0) * 0.1633;
  color += texture2D(image, uv + offset *  1.0) * 0.1531;
  color += texture2D(image, uv + offset *  2.0) * 0.12245;
  color += texture2D(image, uv + offset *  3.0) * 0.0918;
  color += texture2D(image, uv + offset *  4.0) * 0.051;
  
  return color;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uBlurAmount < 0.01) {
    outputColor = inputColor;
    return;
  }
  
  // Two-pass blur (horizontal then vertical)
  vec4 blurH = blur(inputBuffer, uv, uResolution, vec2(1.0, 0.0), uBlurAmount);
  vec4 blurV = blur(inputBuffer, uv, uResolution, vec2(0.0, 1.0), uBlurAmount);
  
  // Combine passes
  vec4 blurred = (blurH + blurV) * 0.5;
  
  // Blend with original based on blur amount
  float blendFactor = clamp(uBlurAmount / 10.0, 0.0, 1.0);
  outputColor = mix(inputColor, blurred, blendFactor);
}
`;

export interface CustomBlurEffectOptions {
    blurAmount?: number;
}

class CustomBlurEffectImpl extends Effect {
    constructor({
        blurAmount = 1.0
    }: CustomBlurEffectOptions = {}) {
        super('CustomBlurEffect', fragmentShader, {
            uniforms: new Map<string, Uniform<any>>([
                ['uBlurAmount', new Uniform(blurAmount)],
                ['uResolution', new Uniform([window.innerWidth, window.innerHeight])],
            ])
        });
    }

    update(renderer: any, inputBuffer: any, deltaTime: number) {
        // Update resolution if window resized
        this.uniforms.get('uResolution')!.value = [window.innerWidth, window.innerHeight];
    }
}

export default function CustomBlurEffect({ blurAmount = 1.0 }: CustomBlurEffectOptions = {}) {
    const { started } = GlobalState();

    const effect = useMemo(
        () => new CustomBlurEffectImpl({ blurAmount }),
        []
    );

    const blurAmountRef = useRef({ value: 10 });

    useEffect(() => {
        if (!started) return;

        const timeline = gsap.timeline();
        timeline.to(blurAmountRef.current, {
            value: 0,
            duration: 10,
            ease: "power2.inOut",
        });
    }, [started]);

    useFrame(() => {
        effect.uniforms.get('uBlurAmount')!.value = blurAmountRef.current.value;
    });

    return <primitive object={effect} dispose={null} />;
}

