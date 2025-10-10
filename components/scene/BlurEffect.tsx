import { useMemo, useRef, useEffect } from 'react';
import { KawaseBlurPass } from 'postprocessing';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import gsap from 'gsap';
import GlobalState from '../common/GlobalStates';


export default function BlurEffect() {
    const { started } = GlobalState();
    const blurToggleRef = useRef(false);
    const blurAnimationRef = useRef<gsap.core.Tween | null>(null);

    const blurParams = useControls('Effects.Kawase Blur', {
        enabled: { value: true },
        kernelSize: { value: 1, min: 0, max: 6, step: 1 },
        scale: { value: 10, min: 0, max: 20, step: 0.1 },
        useAnimation: { value: true, label: 'Use GSAP Animation' }
    }, { collapsed: true });

    
    const maxBlurScale  = 10 
    const blurAmountRef = useRef({ value: maxBlurScale });

    const kawasePass = useMemo(() => {
        const pass = new KawaseBlurPass({ kernelSize: 3 });
        pass.enabled = true;
        return pass;
    }, []);

    useEffect(() => {
        kawasePass.enabled = blurParams.enabled;
        kawasePass.kernelSize = blurParams.kernelSize;
    }, [kawasePass, blurParams.enabled, blurParams.kernelSize]);

    // Initial blur animation when started
    useEffect(() => {
        if (!started) return;

        const timeline = gsap.timeline();
        timeline.to(blurAmountRef.current, {
            value: 0,
            duration: 10,
            ease: "power2.inOut",
        });
    }, [started]);

    // Keyboard toggle for blur effect
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() === 't') {
                blurToggleRef.current = !blurToggleRef.current;

                if (blurAnimationRef.current) {
                    blurAnimationRef.current.kill();
                }

                blurAnimationRef.current = gsap.to(blurAmountRef.current, {
                    value: blurToggleRef.current ? maxBlurScale : 0,
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
    }, []);

    useFrame(() => {
        if (blurParams.useAnimation) {
            kawasePass.scale = blurAmountRef.current.value;
        } else {
            kawasePass.scale = blurParams.scale;
        }
    });

    return <primitive object={kawasePass} dispose={null} />;
}

