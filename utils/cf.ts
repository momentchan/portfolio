/**
 * Check if a URL/path is a Cloudflare R2 image
 * @param urlOrPath - Full URL or path
 * @returns true if it's a Cloudflare R2 image
 */
export const isCloudflareImage = (urlOrPath: string): boolean => {
  return urlOrPath.includes('media.mingjyunhung.com');
};

/**
 * Check if a URL/path is a local image (from public folder)
 * @param urlOrPath - Full URL or path
 * @returns true if it's a local image
 */
export const isLocalImage = (urlOrPath: string): boolean => {
  return !isCloudflareImage(urlOrPath) && (urlOrPath.startsWith('/') || urlOrPath.startsWith('./'));
};

/**
 * Extract path from full URL or return path as-is
 * @param urlOrPath - Full URL or path
 * @returns Path starting with /
 */
export const extractPath = (urlOrPath: string): string => {
  if (urlOrPath.includes('media.mingjyunhung.com')) {
    // Extract path from full URL
    const parts = urlOrPath.split('media.mingjyunhung.com');
    const pathPart = parts[1] || '';
    // Remove any existing cdn-cgi/image transforms
    return pathPart.split('cdn-cgi/image/')[1] || pathPart;
  }
  return urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
};

/**
 * Cloudflare Image Resizing utility
 * Generates optimized image URLs using Cloudflare's CDN
 * @param urlOrPath - Full URL or path on R2 (e.g., "https://media.mingjyunhung.com/projects/drift/cover.jpg" or "/projects/drift/cover.jpg")
 * @param opts - Cloudflare image transformation options
 * @returns Full URL with transformations
 */
export const cf = (urlOrPath: string, opts: string): string => {
  const path = extractPath(urlOrPath);
  return `https://media.mingjyunhung.com/cdn-cgi/image/${opts}${path}`;
};

/**
 * Preset image transformation options for common use cases
 */
export const imagePresets = {
  thumbnail: 'width=400,fit=cover,format=auto,quality=80',
  small: 'width=640,fit=cover,format=auto,quality=80',
  medium: 'width=1024,fit=cover,format=auto,quality=85',
  large: 'width=1600,fit=cover,format=auto,quality=85',
  full: 'width=2400,fit=cover,format=auto,quality=90',
  // Specific presets
  hero: 'width=1920,height=1080,fit=cover,format=auto,quality=85',
  card: 'width=800,height=600,fit=cover,format=auto,quality=80',
} as const;

export type ImagePreset = keyof typeof imagePresets;

/**
 * Generate a cloudflare image URL using preset
 * @param urlOrPath - Full URL or path
 * @param preset - Preset name
 */
export const cfPreset = (urlOrPath: string, preset: ImagePreset): string => {
  return cf(urlOrPath, imagePresets[preset]);
};

/**
 * Generate srcset for responsive images
 * @param urlOrPath - Full URL or path
 * @param widths - Array of widths for srcset
 */
export const cfSrcSet = (urlOrPath: string, widths: number[]): string => {
  return widths
    .map((width) => {
      const url = cf(urlOrPath, `width=${width},fit=cover,format=auto,quality=85`);
      return `${url} ${width}w`;
    })
    .join(', ');
};

