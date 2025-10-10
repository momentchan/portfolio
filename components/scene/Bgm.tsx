import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalStates from '../common/GlobalStates';

interface SoundData {
    file: string;
    volume: number;
}

interface SoundRef {
    audio: THREE.Audio<GainNode>;
    targetVolume: number;
}

const SOUND_FILES: SoundData[] = [
    { file: 'audio/fever-dreams-3am.mp3', volume: 1 },
    { file: 'audio/noise.mp3', volume: 0.4 },
];

const FADE_DURATION = 0.5; // seconds

/**
 * Smoothly fade audio using WebAudio GainNode API
 * Prevents first-frame audio leaks and clicking sounds
 */
const fadeAudioGain = (
    audio: THREE.Audio<GainNode>,
    context: AudioContext,
    targetVolume: number,
    duration: number = FADE_DURATION,
    onComplete?: () => void
) => {
    const now = context.currentTime;
    const gainNode = audio.gain;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + duration);

    if (onComplete) {
        setTimeout(onComplete, duration * 1000);
    }
};

/**
 * Initialize audio with gain set to 0 to prevent audio leaks
 */
const createSilentAudio = (
    listener: THREE.AudioListener,
    context: AudioContext
): THREE.Audio<GainNode> => {
    const audio = new THREE.Audio(listener);
    audio.gain.gain.setValueAtTime(0, context.currentTime);
    return audio;
};

/**
 * Ensure AudioContext is resumed (browser autoplay policy)
 */
const ensureAudioContextResumed = async (context: AudioContext) => {
    if (context.state === 'suspended') {
        await context.resume();
    }
};

export default function BGM() {
    const { camera } = useThree();
    const { started, soundOn } = GlobalStates();
    const soundsRef = useRef<SoundRef[]>([]);
    const listenerRef = useRef<THREE.AudioListener | null>(null);
    const hasInitialized = useRef(false);

    const fadeAudio = useCallback((
        soundRef: SoundRef,
        targetVolume: number,
        onComplete?: () => void
    ) => {
        const ctx = listenerRef.current?.context;
        if (!ctx) return;

        fadeAudioGain(soundRef.audio, ctx, targetVolume, FADE_DURATION, onComplete);
    }, []);

    // Setup audio listener
    useEffect(() => {
        if (!listenerRef.current) {
            listenerRef.current = new THREE.AudioListener();
            camera.add(listenerRef.current);
        }

        return () => {
            if (listenerRef.current) {
                camera.remove(listenerRef.current);
            }
        };
    }, [camera]);

    // Load audio files when started
    useEffect(() => {
        if (!started || hasInitialized.current || !listenerRef.current) return;

        hasInitialized.current = true;
        const listener = listenerRef.current;
        const context = listener.context;
        const audioLoader = new THREE.AudioLoader();

        SOUND_FILES.forEach((soundData) => {
            const audio = createSilentAudio(listener, context);

            audioLoader.load(
                soundData.file,
                (buffer) => {
                    audio.setBuffer(buffer);
                    audio.setLoop(true);
                },
                undefined,
                (error) => console.error(`Failed to load ${soundData.file}:`, error)
            );

            soundsRef.current.push({
                audio,
                targetVolume: soundData.volume,
            });
        });

        return () => {
            soundsRef.current.forEach(({ audio }) => {
                if (audio.isPlaying) audio.stop();
                audio.disconnect();
            });
            soundsRef.current = [];
            hasInitialized.current = false; // Reset for StrictMode
        };
    }, [started]);

    // Toggle audio playback with smooth fade
    useEffect(() => {
        const context = listenerRef.current?.context;
        if (!context) return;

        const toggleAudio = async () => {
            if (soundOn) {
                await ensureAudioContextResumed(context);
            }

            for (const soundRef of soundsRef.current) {
                const { audio, targetVolume } = soundRef;
                if (!audio.buffer) continue;

                if (soundOn) {

                    if (!audio.isPlaying) {
                        audio.gain.gain.setValueAtTime(0, context.currentTime);
                        audio.play();
                    }
                    fadeAudio(soundRef, targetVolume);
                } else {
                    fadeAudio(soundRef, 0, () => {
                        if (audio.isPlaying) {
                            audio.pause();
                        }
                    });
                }
            }
        };

        toggleAudio();
    }, [soundOn, fadeAudio]);

    return null;
}
