import { useMemo, useRef, useEffect } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import GlobalState from '../common/GlobalStates';

const fragmentShader = /* glsl */`
uniform float uBlurAmount;
uniform vec2 uResolution;

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
  
  // Two-direction blur
  vec4 blurH = blur(inputBuffer, uv, uResolution, vec2(1.0, 0.0), uBlurAmount);
  vec4 blurV = blur(inputBuffer, uv, uResolution, vec2(0.0, 1.0), uBlurAmount);
  vec4 blurred = (blurH + blurV) * 0.5;
  
  // Blend with original
  float blendFactor = clamp(uBlurAmount / 10.0, 0.0, 1.0);
  outputColor = mix(inputColor, blurred, blendFactor) * mix(1.0, 1.0, blendFactor);
}
`;

const BLUR_FADE_DURATION = 10; // seconds
const BLUR_TOGGLE_DURATION = 0.5; // seconds

export interface CustomEffectOptions {
    blurAmount?: number;
}

class CustomBlurEffectImpl extends Effect {
    constructor({ blurAmount = 1.0 }: CustomEffectOptions = {}) {
        super('CustomBlurEffect', fragmentShader, {
            uniforms: new Map<string, Uniform>([
                ['uBlurAmount', new Uniform(blurAmount)],
                ['uResolution', new Uniform([window.innerWidth, window.innerHeight])],
            ])
        });
    }

    update(renderer: any, inputBuffer: any, deltaTime: number) {
        this.uniforms.get('uResolution')!.value = [window.innerWidth, window.innerHeight];
    }
}

export default function CustomEffect({ blurAmount = 10.0 }: CustomEffectOptions = {}) {
    const { started } = GlobalState();
    const blurAmountRef = useRef({ value: blurAmount });
    const blurToggleRef = useRef(false);
    const activeAnimationRef = useRef<gsap.core.Tween | null>(null);

    const effect = useMemo(() => new CustomBlurEffectImpl({ blurAmount }), []);

    const killActiveAnimation = () => {
        if (activeAnimationRef.current) {
            activeAnimationRef.current.kill();
            activeAnimationRef.current = null;
        }
    };

    const animateBlurAmount = (targetValue: number, duration: number) => {
        killActiveAnimation();
        activeAnimationRef.current = gsap.to(blurAmountRef.current, {
            value: targetValue,
            duration,
            ease: "power2.inOut",
        });
    };

    // Fade out blur when started
    useEffect(() => {
        if (!started) return;

        animateBlurAmount(0, BLUR_FADE_DURATION);

        return () => {
            killActiveAnimation();
            blurAmountRef.current.value = blurAmount;
        };
    }, [started, blurAmount]);

    // Toggle blur with 'T' key
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 't') {
                blurToggleRef.current = !blurToggleRef.current;
                const target = blurToggleRef.current ? blurAmount : 0;
                animateBlurAmount(target, BLUR_TOGGLE_DURATION);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            killActiveAnimation();
        };
    }, [blurAmount]);

    useFrame(() => {
        effect.uniforms.get('uBlurAmount')!.value = blurAmountRef.current.value;
    });

    return <primitive object={effect} dispose={null} />;
}
