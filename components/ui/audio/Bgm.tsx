import { useEffect, useRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalStates from '@/components/common/GlobalStates';

// Audio management types and constants
interface SoundData {
    file: string;
    volume: number;
}

interface SoundRef {
    audio: THREE.Audio<GainNode>;
    targetVolume: number;
}

const SOUND_FILES: SoundData[] = [
    { file: '/audio/fever-dreams-3am.mp3', volume: 1 },
    { file: '/audio/noise.mp3', volume: 0.4 },
];

const FADE_DURATION = 0.5; // seconds

/**
 * Smoothly fade audio using WebAudio GainNode API
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
 * BGM component that handles audio loading, playback, and iOS/Safari compatibility
 */
export default function BGM() {
    const { camera } = useThree();
    const { started, soundOn, setStarted } = GlobalStates();
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

    // Setup audio listener immediately when component mounts
    useEffect(() => {
        if (!listenerRef.current) {
            listenerRef.current = new THREE.AudioListener();
            camera.add(listenerRef.current);
        }
    }, [camera]);

    // Load audio files when listener is available
    useEffect(() => {
        if (hasInitialized.current || !listenerRef.current) return;

        hasInitialized.current = true;
        const listener = listenerRef.current;
        const context = listener.context;
        const audioLoader = new THREE.AudioLoader();

        const loadAudio = () => {
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
        };

        // Small delay in production to ensure everything is ready
        const delay = process.env.NODE_ENV === 'production' ? 100 : 0;
        if (delay > 0) {
            setTimeout(loadAudio, delay);
        } else {
            loadAudio();
        }

        return () => {
            soundsRef.current.forEach(({ audio }) => {
                if (audio.isPlaying) audio.stop();
                audio.disconnect();
            });
            soundsRef.current = [];
            hasInitialized.current = false;
        };
    }, []);

    // Initialize audio system if user tries to play before started
    useEffect(() => {
        if (!started && soundOn && listenerRef.current) {
            setStarted(true);
        }
    }, [started, soundOn, setStarted]);

    // Toggle audio playback
    useEffect(() => {
        const context = listenerRef.current?.context;
        if (!context) return;

        const toggleAudio = async () => {
            if (soundOn && context.state === 'suspended') {
                try {
                    await context.resume();
                } catch (error) {
                    console.error('Failed to resume AudioContext:', error);
                    return;
                }
            }

            for (const soundRef of soundsRef.current) {
                const { audio, targetVolume } = soundRef;

                if (!audio.buffer) {
                    // Retry if soundOn is true and buffer isn't ready yet
                    if (soundOn) {
                        setTimeout(() => {
                            const ctx2 = listenerRef.current?.context;
                            const currentSoundOn = GlobalStates.getState().soundOn;
                            if (!ctx2 || !audio.buffer || !currentSoundOn) return;
                            try {
                                audio.gain.gain.setValueAtTime(0, ctx2.currentTime);
                                audio.play();
                                fadeAudio(soundRef, targetVolume);
                            } catch (e) {
                                console.warn('Retry play failed:', e);
                            }
                        }, 300);
                    }
                    continue;
                }

                if (soundOn) {
                    if (!audio.isPlaying) {
                        audio.gain.gain.setValueAtTime(0, context.currentTime);
                        try {
                            audio.play();
                        } catch (error) {
                            console.error('Failed to play audio:', error);
                        }
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

    // Gesture unlock for iOS/Safari - critical for first audio playback
    useEffect(() => {
        const listener = listenerRef.current;
        if (!listener) return;
        const ctx = listener.context as AudioContext;

        let unlocked = false;
        let unlocking = false;

        const tryUnlockAndMaybePlay = async () => {
            if (unlocked || unlocking) return;
            unlocking = true;

            try {
                if (ctx.state !== 'running') {
                    await ctx.resume();
                }

                // Play silent buffer to ensure iOS unlock
                const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.connect(ctx.destination);
                src.start(0);
                src.stop(0);

                unlocked = true;

                // If user already wants sound on, play immediately
                const currentSoundOn = GlobalStates.getState().soundOn;
                if (currentSoundOn) {
                    for (const s of soundsRef.current) {
                        if (s.audio.buffer && !s.audio.isPlaying) {
                            s.audio.gain.gain.setValueAtTime(0, ctx.currentTime);
                            try {
                                s.audio.play();
                                fadeAudio(s, s.targetVolume);
                            } catch (e) {
                                console.warn('First-play after unlock failed:', e);
                            }
                        }
                    }
                }
            } finally {
                unlocking = false;
                events.forEach(eventType => {
                    window.removeEventListener(eventType, tryUnlockAndMaybePlay, { capture: true });
                });
            }
        };

        const events = ['pointerdown', 'keydown', 'touchend', 'click', 'touchstart'] as const;

        events.forEach(eventType => {
            window.addEventListener(eventType, tryUnlockAndMaybePlay, {
                once: true,
                passive: false,
                capture: true
            });
        });

        return () => {
            events.forEach(eventType => {
                window.removeEventListener(eventType, tryUnlockAndMaybePlay, { capture: true });
            });
        };
    }, [fadeAudio]);

    // Handle page visibility changes and restore audio when returning to foreground
    useEffect(() => {
        const listener = listenerRef.current;
        if (!listener) return;
        const ctx = listener.context as AudioContext;

        const handleVisibility = async () => {
            const currentSoundOn = GlobalStates.getState().soundOn;

            if (document.visibilityState === 'visible') {
                // Resume context and playback when returning to foreground
                if (currentSoundOn && ctx.state !== 'running') {
                    try { await ctx.resume(); } catch { }
                }
                if (currentSoundOn) {
                    for (const s of soundsRef.current) {
                        if (s.audio.buffer && !s.audio.isPlaying) {
                            s.audio.gain.gain.setValueAtTime(0, ctx.currentTime);
                            try {
                                s.audio.play();
                                fadeAudio(s, s.targetVolume);
                            } catch (e) {
                                console.warn('Resume play after visibility change failed:', e);
                            }
                        }
                    }
                }
            } else {
                // Pause audio when going to background
                for (const s of soundsRef.current) {
                    if (s.audio.isPlaying) {
                        fadeAudio(s, 0, () => s.audio.pause());
                    }
                }
            }
        };

        const handlePageShow = async () => {
            const currentSoundOn = GlobalStates.getState().soundOn;
            if (currentSoundOn && ctx.state !== 'running') {
                try { await ctx.resume(); } catch { }
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('pageshow', handlePageShow);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [fadeAudio]);

    return null;
}