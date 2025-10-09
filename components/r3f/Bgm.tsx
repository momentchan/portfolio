import React, { useEffect, useRef } from 'react';
import { Audio, AudioLoader } from 'three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import GlobalStates from './GlobalStates';

interface SoundRef {
    audio: THREE.Audio<GainNode>;
    data: { file: string; volume: number; delay: number };
}

export default function BGM() {
    const { camera } = useThree();

    const bgmRefs = useRef<SoundRef[]>([]);
    const { started } = GlobalStates();
    const listener = useRef(new THREE.AudioListener()).current;
    const hasStartedPlayback = useRef(false);

    // Define sound files to play
    const soundData = [
        // { file: '/space.mp3', volume: 0.15, delay: 0, signal: false },
        { file: 'audio/fever-dreams-3am.mp3', volume: 0.3, delay: 0 },
        { file: 'audio/noise.mp3', volume: 0.15, delay: 0 },
        // { file: '/narrative.mp3', volume: 0.02, delay: 3, signal: true }
    ];

    useEffect(() => {
        camera.add(listener);
        
        return () => {
            camera.remove(listener);
        };
    }, [camera, listener])

    useEffect(() => {
        if (!started || hasStartedPlayback.current) return;

        console.log('BGM: Attempting to start playback');
        hasStartedPlayback.current = true;

        soundData.forEach(data => {
            const audio = new THREE.Audio(listener);
            const audioLoader = new THREE.AudioLoader();
            
            audioLoader.load(
                data.file,
                (buffer) => {
                    console.log(`BGM: Loaded ${data.file}`);
                    audio.setBuffer(buffer);
                    audio.setLoop(true);
                    audio.setVolume(data.volume);
                    
                    // Play with delay if specified
                    const playAudio = () => {
                        audio.play();
                        console.log(`BGM: Playing ${data.file}`);
                    };

                    if (data.delay > 0) {
                        setTimeout(playAudio, data.delay * 1000);
                    } else {
                        playAudio();
                    }
                },
                undefined, // onProgress
                (error) => {
                    console.error(`BGM: Error loading ${data.file}:`, error);
                }
            );

            bgmRefs.current.push({ audio: audio, data: data });
        });

        // Cleanup on unmount
        return () => {
            bgmRefs.current.forEach((bgm) => {
                if (bgm.audio.isPlaying) {
                    bgm.audio.stop();
                }
            });
            bgmRefs.current = [];
        };
    }, [started, listener]);

    // useEffect(() => {
    //     if (bgmRefs.current.length > 0) {
    //         bgmRefs.current.forEach((bgm) => {
    //             if (soundOn) {
    //                 if (!bgm.data.signal || (bgm.data.signal && !noted))
    //                     bgm.audio.play(bgm.data.delay);
    //             } else {
    //                 bgm.audio.stop();
    //             }
    //         });
    //     }
    // }, [soundOn]);

    return null;
}