'use client';

import React, { Suspense, useEffect, useState, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// WebGL detection function
function isWebGLAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

interface WebGLCanvasProps {
    children: ReactNode;
    gl?: any;
    frameloop?: 'always' | 'demand' | 'never';
    shadows?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onCreated?: (state: any) => void;
    onError?: (error: any) => void;
    fallback?: ReactNode;
}

export default function WebGLCanvas({
    children,
    gl = {},
    frameloop = 'always',
    shadows = false,
    className,
    style,
    onCreated,
    onError,
    fallback,
    ...props
}: WebGLCanvasProps) {
    const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setWebglAvailable(isWebGLAvailable());
    }, []);

    // Show loading state while checking WebGL availability
    if (webglAvailable === null) {
        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    color: '#ffffff'
                }}
            >
                <div>Loading...</div>
            </div>
        );
    }

    // Fallback UI when WebGL is not available or has errors
    if (!webglAvailable || hasError) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div
                className={className}
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    flexDirection: 'column',
                    gap: '1rem',
                    padding: '2rem',
                    textAlign: 'center'
                }}
            >
                <div>WebGL is not available</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    This experience requires WebGL support. Please enable WebGL in your browser settings or try a different browser.
                </div>
            </div>
        );
    }

    return (
        <Canvas
            shadows={shadows}
            gl={{
                shadowMapType: THREE.PCFSoftShadowMap,
                antialias: true,
                alpha: false,
                powerPreference: "high-performance",
                ...gl
            }}
            frameloop={frameloop}
            className={className}
            style={style}
            onCreated={(state) => {
                // Add error handling for WebGL context creation

                // Suppress WebGL warnings in console
                const originalError = console.error;
                console.error = function (...args) {
                    if (args[0] && typeof args[0] === 'string' && args[0].includes('WebGL')) {
                        return; // Suppress WebGL-related console errors
                    }
                    originalError.apply(console, args);
                };

                if (onCreated) {
                    onCreated(state);
                }
            }}
            onError={(error) => {
                console.warn('Canvas error handled:', error);
                setHasError(true);
                if (onError) {
                    onError(error);
                }
            }}
            {...props}
        >
            {children}
        </Canvas>
    );
}
