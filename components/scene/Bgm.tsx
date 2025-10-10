import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalStates from '../common/GlobalStates';

interface SoundData {
    file: string;
    volume: number;
    delay: number;
}

interface SoundRef {
    audio: THREE.Audio<GainNode>;
    data: SoundData;
}

const SOUND_FILES: SoundData[] = [
    { file: 'audio/fever-dreams-3am.mp3', volume: 0.3, delay: 0 },
    { file: 'audio/noise.mp3', volume: 0.15, delay: 0 },
];

export default function BGM() {
    const { camera } = useThree();
    const { started, soundOn } = GlobalStates();
    const soundsRef = useRef<SoundRef[]>([]);
    const listenerRef = useRef<THREE.AudioListener | null>(null);
    const hasInitialized = useRef(false);

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
        const audioLoader = new THREE.AudioLoader();

        SOUND_FILES.forEach(data => {
            const audio = new THREE.Audio(listenerRef.current!);
            
            audioLoader.load(
                data.file,
                (buffer) => {
                    audio.setBuffer(buffer);
                    audio.setLoop(true);
                    audio.setVolume(data.volume);
                },
                undefined,
                (error) => console.error(`Failed to load ${data.file}:`, error)
            );

            soundsRef.current.push({ audio, data });
        });

        return () => {
            soundsRef.current.forEach(({ audio }) => {
                if (audio.isPlaying) audio.stop();
                audio.disconnect();
            });
            soundsRef.current = [];
        };
    }, [started]);

    // Toggle audio playback based on soundOn state
    useEffect(() => {
        soundsRef.current.forEach(({ audio }) => {
            if (!audio.buffer) return;
            
            if (soundOn && !audio.isPlaying) {
                audio.play();
            } else if (!soundOn && audio.isPlaying) {
                audio.pause();
            }
        });
    }, [soundOn]);

    return null;
}