import { useMemo, useRef, useEffect } from 'react';
import { Effect } from 'postprocessing';
import { Uniform } from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import GlobalState from '../common/GlobalStates';

// Optimized separable Gaussian blur with linear sampling
const fragmentShader = /* glsl */`
uniform float uBlurAmount;
uniform vec2 uTexelSize;
uniform vec2 uDirection;

vec4 blur5_linear(sampler2D img, vec2 uv, vec2 dir, float amount) {
  if (amount <= 0.01) return texture2D(img, uv);

  // Gaussian weights optimized for linear sampling
  float w0 = 0.227027;
  float w1 = 0.316216;
  float w2 = 0.070270;

  vec2 step = dir * uTexelSize * amount;

  vec4 c = texture2D(inputBuffer, uv) * w0;
  c += texture2D(inputBuffer, uv + step * 1.384615) * w1;
  c += texture2D(inputBuffer, uv - step * 1.384615) * w1;
  c += texture2D(inputBuffer, uv + step * 3.230769) * w2;
  c += texture2D(inputBuffer, uv - step * 3.230769) * w2;

  return c;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uBlurAmount < 0.01) {
    outputColor = inputColor;
    return;
  }

  vec4 blurred = blur5_linear(inputBuffer, uv, uDirection, uBlurAmount);
  
  // Blend with original
  float blendFactor = clamp(uBlurAmount / 15.0, 0.0, 1.0);
  outputColor = mix(inputColor, blurred, blendFactor);
}
`;

export interface CustomEffectOptions {
    blurAmount?: number;
    scale?: number;
}

/** Single-direction separable blur effect */
class SeparableBlurEffect extends Effect {
    private _scale: number;

    constructor(direction: [number, number], scale = 0.5, initialAmount = 0) {
        super('SeparableBlur', fragmentShader, {
            uniforms: new Map<string, Uniform>([
                ['uBlurAmount', new Uniform(initialAmount)],
                ['uTexelSize', new Uniform([1, 1])],
                ['uDirection', new Uniform(direction)],
            ])
        });

        this._scale = Math.max(0.25, Math.min(scale, 1.0));
    }

    set amount(v: number) {
        this.uniforms.get('uBlurAmount')!.value = v;
    }

    get amount() {
        return this.uniforms.get('uBlurAmount')!.value;
    }

    setSize(w: number, h: number) {
        const iw = Math.max(1, Math.floor(w * this._scale));
        const ih = Math.max(1, Math.floor(h * this._scale));
        this.uniforms.get('uTexelSize')!.value = [1 / iw, 1 / ih];
    }
}

export default function CustomEffect({ 
    blurAmount = 10, 
    scale = 0.5 
}: CustomEffectOptions = {}) {
    const { started } = GlobalState();
    const blurAmountRef = useRef({ value: blurAmount });
    const blurToggleRef = useRef(false);
    const blurAnimationRef = useRef<gsap.core.Tween | null>(null);

    // Create two passes: horizontal then vertical
    const [blurX, blurY] = useMemo(() => {
        const x = new SeparableBlurEffect([1, 0], scale, blurAmount);
        const y = new SeparableBlurEffect([0, 1], scale, blurAmount);
        return [x, y];
    }, [scale]);

    // Animate blur on start
    useEffect(() => {
        if (!started) return;

        const tween = gsap.timeline();
        tween.to(blurAmountRef.current, {
            value: 0,
            duration: 10,
            ease: "power2.inOut",
        });

        return () => {
            tween.kill();
            blurAmountRef.current.value = blurAmount;
        };
    }, [started, blurAmount]);

    // Keyboard toggle for blur effect (T key)
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 't') {
                blurToggleRef.current = !blurToggleRef.current;

                if (blurAnimationRef.current) {
                    blurAnimationRef.current.kill();
                }

                blurAnimationRef.current = gsap.to(blurAmountRef.current, {
                    value: blurToggleRef.current ? blurAmount : 0,
                    duration: 0.5,
                    ease: "power2.inOut",
                });
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (blurAnimationRef.current) {
                blurAnimationRef.current.kill();
            }
        };
    }, [blurAmount]);

    // Update both passes each frame
    useFrame(() => {
        const amt = blurAmountRef.current.value;
        blurX.amount = amt;
        blurY.amount = amt;
    });

    return (
        <>
            <primitive object={blurX} dispose={null} />
            <primitive object={blurY} dispose={null} />
        </>
    );
}
