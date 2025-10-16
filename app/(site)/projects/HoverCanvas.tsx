'use client';

import { useLayoutEffect, useState, useCallback, Suspense, useRef, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, ShaderMaterial } from 'three';
import simplexNoise from '@/lib/r3f-gist/shader/cginc/noise/simplexNoise.glsl?raw';

// ============================================================================
// TYPES
// ============================================================================

interface HoverCanvasProps {
    hoveredElement: HTMLElement | null;
    imageUrl?: string | null;
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
        
        // ========================================
        // MOSAIC EFFECT (Adaptive grid based on brightness)
        // ========================================
        
        // Sample original color at current position to get brightness
        vec4 originalColor = texture2D(uTexture, vUv);
        float brightness = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114)); // Grayscale conversion
        
        // Quantize brightness into discrete levels
        float brightnessLevels = 1.0; // Number of brightness steps
        float quantizedBrightness = floor(brightness * brightnessLevels) / brightnessLevels;
        
        // Grid size varies with quantized brightness (brighter = larger blocks, darker = smaller blocks)
        float minGridSize = 0.5;
        float maxGridSize = 2.0;
        float gridSize = mix(minGridSize, maxGridSize, brightness);
        
        // Create mosaic blocks
        vec2 mosaicUv = floor(vUv * gridSize) / gridSize;
        
        // Sample from center of each block for solid color
        vec2 blockCenter = (floor(vUv * gridSize) + 0.5) / gridSize;
        vec4 mosaicColor = texture2D(uTexture, blockCenter);
        
        // ========================================
        // GLITCH EFFECT (Horizontal displacement on blocks)
        // ========================================
        float glitchBands = 100.0;
        float glitchSegments = 10.0;
        
        float yBand = floor(vUv.y * glitchBands);
        float xSegment = floor(vUv.x * glitchSegments);
        
        // Random selection for each cell
        float cellRandom = simplexNoise2d(vec2(yBand * 0.1, xSegment * 0.1));
        
        // Time-based glitch trigger
        float glitchNoise = simplexNoise2d(vec2(cellRandom, uTime * 1.0));
        float glitchTrigger = step(0.8, glitchNoise);
        
        // Horizontal offset
        float xGlitch = glitchNoise * 0.05 * glitchTrigger;
        
        // Apply glitch to mosaic UV
        vec2 glitchedUv = mosaicUv;
        glitchedUv.x += xGlitch;
        
        // ========================================
        // RGB SHIFT (Chromatic aberration)
        // ========================================
        float rgbShift = 0.01;
        vec2 direction = vec2(1.0, 0.0);
        
        // Sample RGB channels with mosaic, glitch, and shift
        float r = texture2D(uTexture, glitchedUv + direction * rgbShift).r;
        float g = texture2D(uTexture, glitchedUv).g;
        float b = texture2D(uTexture, glitchedUv - direction * rgbShift).b;
        
        // Use mosaic color
        vec4 color = mosaicColor;
        
        gl_FragColor = color;
    }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateUvTransform(
    containerAspect: number,
    imageAspect: number,
    containerWidth: number,
    containerHeight: number
): { planeWidth: number; planeHeight: number; uvTransform: UvTransform } {
    let planeWidth = containerWidth;
    let planeHeight = containerHeight;
    let uvScale = { x: 1, y: 1 };
    let uvOffset = { x: 0, y: 0 };

    if (imageAspect > containerAspect) {
        // Image is wider - fit to height, crop sides
        planeWidth = containerHeight * imageAspect;
        planeHeight = containerHeight;
        const visibleRatio = containerWidth / planeWidth;
        uvScale = { x: visibleRatio, y: 1 };
        uvOffset = { x: (1 - visibleRatio) / 2, y: 0 };
    } else {
        // Image is taller - fit to width, crop top/bottom
        planeWidth = containerWidth;
        planeHeight = containerWidth / imageAspect;
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
    // Load texture with error handling
    const texture = useLoader(TextureLoader, imageUrl, (loader) => {
        loader.crossOrigin = 'anonymous';
    });

    // Force texture to use nearest filtering for sharper look
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

export default function HoverCanvas({ hoveredElement, imageUrl }: HoverCanvasProps) {
    const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 0, height: 0 });
    const [clipPath, setClipPath] = useState('none');
    const [isVisible, setIsVisible] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

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

    // Handle image URL changes - update immediately but briefly hide to prevent stale image flicker
    useLayoutEffect(() => {
        if (imageUrl !== currentImageUrl) {
            if (!imageUrl) {
                // No image - clear immediately
                setCurrentImageUrl(null);
                setIsVisible(false);
            } else {
                // New image - hide briefly then show
                setIsVisible(false);
                requestAnimationFrame(() => {
                    setCurrentImageUrl(imageUrl);
                    requestAnimationFrame(() => {
                        setIsVisible(!!hoveredElement);
                    });
                });
            }
        }
    }, [imageUrl, currentImageUrl, hoveredElement]);

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

    if (!isVisible) return null;

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
            >
                <Suspense
                    fallback={
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[position.width, position.height]} />
                            <meshBasicMaterial color="#000000" transparent opacity={0} />
                        </mesh>
                    }
                >
                    {currentImageUrl && (
                        <ImagePlane
                            key={currentImageUrl}
                            imageUrl={currentImageUrl}
                            width={position.width}
                            height={position.height}
                            mousePos={mousePosition}
                        />
                    )}
                </Suspense>
            </Canvas>
        </div>
    );
}
