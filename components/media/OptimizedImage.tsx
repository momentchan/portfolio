import Image, { ImageProps } from 'next/image';
import { cf, extractPath, isCloudflareImage, isLocalImage, ImagePreset, imagePresets } from '@site/_shared/utils/cf';

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'loader'> {
    /**
     * Full URL or path to the image
     * Supports both Cloudflare R2 and local images:
     * - Cloudflare: "https://media.mingjyunhung.com/projects/expo/expo_001.jpg"
     * - Local: "/textures/rust_coarse_01_nor_dx_1k.png"
     */
    path: string;
    /**
     * Use a preset configuration (only applies to Cloudflare images)
     */
    preset?: ImagePreset;
    /**
     * Custom Cloudflare transformation options (only applies to Cloudflare images)
     */
    opts?: string;
    /**
     * Enable responsive srcset generation
     */
    responsive?: boolean;
    /**
     * Custom widths for srcset (default: [640, 1024, 1600, 2400])
     */
    srcSetWidths?: number[];
}

/**
 * Smart image component that handles both Cloudflare R2 and local images
 * Automatically detects the image source and applies appropriate optimization
 */
export default function OptimizedImage({
    path,
    preset = 'large',
    opts,
    responsive = true,
    srcSetWidths = [640, 1024, 1600, 2400],
    alt,
    sizes,
    className,
    loading = 'lazy',
    quality = 85,
    ...props
}: OptimizedImageProps) {
    // Detect if this is a Cloudflare or local image
    const isCloudflare = isCloudflareImage(path);
    const isLocal = isLocalImage(path);

    // Default responsive sizes if not provided
    const defaultSizes = sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, (max-width: 1600px) 70vw, 1200px';

    // Handle Cloudflare R2 images with transformations
    if (isCloudflare) {
        // Custom loader for Cloudflare Image Resizing
        const cloudflareLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
            // Extract path from the source URL
            const cleanPath = extractPath(src);
            // Generate optimized Cloudflare URL
            return cf(
                cleanPath,
                `width=${width},fit=cover,format=auto,quality=${quality || 85}`
            );
        };

        return (
            <Image
                src={path} // Pass original URL to loader
                alt={alt}
                loader={cloudflareLoader}
                sizes={defaultSizes}
                className={className}
                loading={loading}
                quality={quality}
                {...props}
            />
        );
    }

    // Handle local images (from public folder) - use default Next.js optimization
    if (isLocal) {
        return (
            <Image
                src={path}
                alt={alt}
                sizes={defaultSizes}
                className={className}
                loading={loading}
                quality={quality}
                {...props}
            />
        );
    }

    // Fallback for external images (not Cloudflare, not local)
    return (
        <Image
            src={path}
            alt={alt}
            sizes={defaultSizes}
            className={className}
            loading={loading}
            quality={quality}
            unoptimized
            {...props}
        />
    );
}

