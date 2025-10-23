'use client';

import { useLayoutEffect, useState, useCallback, Suspense, useRef, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial, VideoTexture } from 'three';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl?raw';

// ============================================================================
// TYPES
// ============================================================================

interface HoverCanvasProps {
    hoveredElement: HTMLElement | null;
    mediaUrl?: string | null;
    isVideo?: boolean;
}

interface Position {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface UvTransform {
    scale: { x: number; y: number };
    offset: { x: number; y: number };
}

// ============================================================================
// SHADERS
// ============================================================================

const vertexShader = /* glsl */ `
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    ${simplexNoise}
    
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uHover;
    uniform vec2 uMouse;
    uniform float uAspect;
    uniform vec2 uUvScale;
    uniform vec2 uUvOffset;
    
    varying vec2 vUv;
    
    void main() {
        vec2 uv = (vUv - uUvOffset) / uUvScale * vec2(1.0, uAspect);
        float dist = length(uv - uMouse);
        
        // Glitch bands
        float glitchBands = 100.0;
        float glitchSegments = 10.0;
        float yBand = floor(vUv.y * glitchBands);
        float xSegment = floor(vUv.x * glitchSegments);
        
        // Random cell selection
        float cellRandom = simplexNoise2d(vec2(yBand * 0.1, xSegment * 0.1));
        float glitchNoise = simplexNoise2d(vec2(cellRandom, uTime * 1.0));
        float glitchTrigger = step(0.8, glitchNoise);
        
        // Horizontal glitch offset
        float xGlitch = glitchNoise * 0.05 * glitchTrigger;
        vec2 glitchedUv = vUv;
        glitchedUv.x += xGlitch;
        
        // RGB shift
        float rgbShift = 0.01;
        vec2 direction = vec2(1.0, 0.0);
        
        float r = texture2D(uTexture, glitchedUv + direction * rgbShift).r;
        float g = texture2D(uTexture, glitchedUv).g;
        float b = texture2D(uTexture, glitchedUv - direction * rgbShift).b;
        
        vec4 color = vec4(r, g, b, 1.0);
        
        gl_FragColor = color;
    }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateUvTransform(
    containerAspect: number,
    mediaAspect: number,
    containerWidth: number,
    containerHeight: number
): { planeWidth: number; planeHeight: number; uvTransform: UvTransform } {
    let planeWidth = containerWidth;
    let planeHeight = containerHeight;
    let uvScale = { x: 1, y: 1 };
    let uvOffset = { x: 0, y: 0 };

    if (mediaAspect > containerAspect) {
        // Media is wider - fit to height, crop sides
        planeWidth = containerHeight * mediaAspect;
        planeHeight = containerHeight;
        const visibleRatio = containerWidth / planeWidth;
        uvScale = { x: visibleRatio, y: 1 };
        uvOffset = { x: (1 - visibleRatio) / 2, y: 0 };
    } else {
        // Media is taller - fit to width, crop top/bottom
        planeWidth = containerWidth;
        planeHeight = containerWidth / mediaAspect;
        const visibleRatio = containerHeight / planeHeight;
        uvScale = { x: 1, y: visibleRatio };
        uvOffset = { x: 0, y: (1 - visibleRatio) / 2 };
    }

    return { planeWidth, planeHeight, uvTransform: { scale: uvScale, offset: uvOffset } };
}

function findScrollableParent(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement;
    while (parent) {
        const overflow = window.getComputedStyle(parent).overflow;
        if (overflow === 'auto' || overflow === 'scroll' || overflow === 'hidden') {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

function calculateClipPath(elementRect: DOMRect, parentRect: DOMRect): string {
    const clipTop = Math.max(0, parentRect.top - elementRect.top);
    const clipLeft = Math.max(0, parentRect.left - elementRect.left);
    const clipBottom = Math.max(0, elementRect.bottom - parentRect.bottom);
    const clipRight = Math.max(0, elementRect.right - parentRect.right);

    return `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px)`;
}

// ============================================================================
// COMPONENTS
// ============================================================================

// Video texture component
function VideoPlane({
    videoUrl,
    width,
    height,
    mousePos
}: {
    videoUrl: string;
    width: number;
    height: number;
    mousePos: { x: number; y: number };
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const textureRef = useRef<VideoTexture | null>(null);
    const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
    const materialRef = useRef<ShaderMaterial>(null);

    // Cleanup on component unmount
    useLayoutEffect(() => {
        return () => {
            // Final cleanup when component is completely unmounted
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
                videoRef.current = null;
            }
            if (textureRef.current) {
                textureRef.current.dispose();
                textureRef.current = null;
            }
        };
    }, []);

    useLayoutEffect(() => {
        // Reuse video element if exists, otherwise create new one
        let video = videoRef.current;
        if (!video) {
            video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';
            videoRef.current = video;
        }

        let playPromise: Promise<void> | undefined;
        let mounted = true;

        // Create or reuse texture
        let texture = textureRef.current;
        if (!texture) {
            texture = new VideoTexture(video);
            texture.generateMipmaps = false;
            textureRef.current = texture;
        }

        // Update video source
        if (video.src !== videoUrl) {
            video.src = videoUrl;

            const handleLoaded = () => {
                if (mounted) {
                    playPromise = video!.play().catch((err) => {
                        console.warn('Video play failed:', err);
                    });
                    setVideoTexture(texture);
                }
            };

            video.addEventListener('loadeddata', handleLoaded, { once: true });
            video.load();
        } else {
            // Same video, just ensure it's playing
            setVideoTexture(texture);
            playPromise = video.play().catch(() => { });
        }

        return () => {
            mounted = false;
            // Pause but keep video element alive for reuse
            if (video && playPromise) {
                playPromise.then(() => {
                    video.pause();
                }).catch(() => {
                    // Already paused or failed
                });
            }
        };
    }, [videoUrl, videoTexture]);

    const containerAspect = width / height;
    const videoAspect = videoTexture?.image ?
        videoTexture.image.videoWidth / videoTexture.image.videoHeight : containerAspect;

    const { planeWidth, planeHeight, uvTransform } = useMemo(
        () => calculateUvTransform(containerAspect, videoAspect, width, height),
        [containerAspect, videoAspect, width, height]
    );

    const uniforms = useMemo(() => ({
        uTexture: { value: videoTexture },
        uTime: { value: 0 },
        uHover: { value: 1 },
        uMouse: { value: [0.5, 0.5] },
        uAspect: { value: containerAspect },
        uUvScale: { value: [uvTransform.scale.x, uvTransform.scale.y] },
        uUvOffset: { value: [uvTransform.offset.x, uvTransform.offset.y] },
    }), [videoTexture, containerAspect, uvTransform]);

    useFrame((state) => {
        if (materialRef.current && videoTexture) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uMouse.value = [mousePos.x, 1.0 - mousePos.y];
            videoTexture.needsUpdate = true; // Update video frame every frame
        }
    });

    if (!videoTexture || planeWidth <= 0 || planeHeight <= 0 || !isFinite(planeWidth) || !isFinite(planeHeight)) {
        return null;
    }

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[planeWidth, planeHeight]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                toneMapped={false}
            />
        </mesh>
    );
}

// Image texture component
function ImagePlane({
    imageUrl,
    width,
    height,
    mousePos
}: {
    imageUrl: string;
    width: number;
    height: number;
    mousePos: { x: number; y: number };
}) {
    const texture = useLoader(TextureLoader, imageUrl, (loader) => {
        loader.crossOrigin = 'anonymous';
    });

    texture.generateMipmaps = false;

    const materialRef = useRef<ShaderMaterial>(null);

    const containerAspect = width / height;
    const imageAspect = texture.image ? texture.image.width / texture.image.height : containerAspect;

    const { planeWidth, planeHeight, uvTransform } = useMemo(
        () => calculateUvTransform(containerAspect, imageAspect, width, height),
        [containerAspect, imageAspect, width, height]
    );

    const uniforms = useMemo(() => ({
        uTexture: { value: texture },
        uTime: { value: 0 },
        uHover: { value: 1 },
        uMouse: { value: [0.5, 0.5] },
        uAspect: { value: containerAspect },
        uUvScale: { value: [uvTransform.scale.x, uvTransform.scale.y] },
        uUvOffset: { value: [uvTransform.offset.x, uvTransform.offset.y] },
    }), [texture, containerAspect, uvTransform]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uMouse.value = [mousePos.x, 1.0 - mousePos.y];
        }
    });

    if (planeWidth <= 0 || planeHeight <= 0 || !isFinite(planeWidth) || !isFinite(planeHeight)) {
        return null;
    }

    return (
        <mesh position={[0, 0, 0]}>
            <planeGeometry args={[planeWidth, planeHeight]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                toneMapped={false}
            />
        </mesh>
    );
}

export default function HoverCanvas({ hoveredElement, mediaUrl, isVideo = false }: HoverCanvasProps) {
    const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 0, height: 0 });
    const [clipPath, setClipPath] = useState('none');
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
    const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);
    const [currentIsVideo, setCurrentIsVideo] = useState(false);

    // Update position and clipping
    const updatePosition = useCallback(() => {
        if (!hoveredElement) return;

        const rect = hoveredElement.getBoundingClientRect();
        const scrollParent = findScrollableParent(hoveredElement);

        if (scrollParent) {
            const parentRect = scrollParent.getBoundingClientRect();
            setClipPath(calculateClipPath(rect, parentRect));
        } else {
            setClipPath('none');
        }

        setPosition({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        });
    }, [hoveredElement]);

    // Initialize visibility and position
    useLayoutEffect(() => {
        setIsVisible(!!hoveredElement);
        if (hoveredElement) {
            updatePosition();
        }
    }, [hoveredElement, updatePosition]);

    // Handle media URL changes
    useLayoutEffect(() => {
        if (mediaUrl !== currentMediaUrl || isVideo !== currentIsVideo) {
            if (!mediaUrl) {
                setCurrentMediaUrl(null);
                setCurrentIsVideo(false);
                setIsVisible(false);
            } else {
                setIsVisible(false);
                requestAnimationFrame(() => {
                    setCurrentMediaUrl(mediaUrl);
                    setCurrentIsVideo(isVideo);
                    requestAnimationFrame(() => {
                        setIsVisible(!!hoveredElement);
                    });
                });
            }
        }
    }, [mediaUrl, currentMediaUrl, isVideo, currentIsVideo, hoveredElement]);

    // Track mouse position
    useLayoutEffect(() => {
        if (!hoveredElement) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = hoveredElement.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setMousePosition({ x, y });
        };

        hoveredElement.addEventListener('mousemove', handleMouseMove);
        return () => hoveredElement.removeEventListener('mousemove', handleMouseMove);
    }, [hoveredElement]);

    // Update position every frame and on resize
    useLayoutEffect(() => {
        if (!hoveredElement) return;

        let frameId: number;
        const loop = () => {
            updatePosition();
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);

        const handleResize = () => updatePosition();
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [hoveredElement, updatePosition]);

    if (!isVisible || position.width <= 0 || position.height <= 0) return null;

    return (
        <div
            className="fixed pointer-events-none z-20"
            style={{
                top: position.top,
                left: position.left,
                width: position.width,
                height: position.height,
                pointerEvents: 'none',
                clipPath,
            }}
        >
            <Canvas
                style={{ pointerEvents: 'none' }}
                orthographic
                camera={{
                    position: [0, 0, 100],
                    zoom: 1,
                    left: -position.width / 2,
                    right: position.width / 2,
                    top: position.height / 2,
                    bottom: -position.height / 2,
                    near: 0.1,
                    far: 1000,
                }}
                onCreated={({ gl }) => {
                    // Prevent default context loss behavior and handle gracefully
                    gl.domElement.addEventListener('webglcontextlost', (e) => {
                        e.preventDefault();
                    });
                    gl.domElement.addEventListener('webglcontextrestored', () => {
                        // Context restored - Three.js will handle rebuilding
                    });
                }}
            >
                <Suspense fallback={null}>
                    {currentMediaUrl && (
                        currentIsVideo ? (
                            <VideoPlane
                                key={currentMediaUrl}
                                videoUrl={currentMediaUrl}
                                width={position.width}
                                height={position.height}
                                mousePos={mousePosition}
                            />
                        ) : (
                            <ImagePlane
                                key={currentMediaUrl}
                                imageUrl={currentMediaUrl}
                                width={position.width}
                                height={position.height}
                                mousePos={mousePosition}
                            />
                        )
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
}
