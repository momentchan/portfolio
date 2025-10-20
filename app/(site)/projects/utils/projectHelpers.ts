import { ProjectMeta } from '@/lib/mdx';
import { isCloudflareImage } from '@/utils/cf';

export function isVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.ogg'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
}

export function getFullMediaUrl(mediaPath: string | undefined): string | null {
  if (!mediaPath) return null;

  // Cloudflare media - use as-is (already full URL)
  if (isCloudflareImage(mediaPath)) {
    return mediaPath;
  }

  // Local media - use relative path (Next.js handles it correctly)
  return mediaPath;
}

export function getCoverMedia(project: ProjectMeta): { url: string | null; isVideo: boolean } {
  const url = getFullMediaUrl(project.cover);
  return { url, isVideo: isVideoUrl(project.cover) };
}

export type Category = 'all' | 'featured' | 'web' | 'experiential' | 'lab';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'Featured' },
  { value: 'web', label: 'Web' },
  { value: 'experiential', label: 'Experiential' },
  { value: 'lab', label: 'Lab' },
];

export function filterProjectsByCategory(
  projects: ProjectMeta[], 
  category: Category
): ProjectMeta[] {
  return projects.filter((project) => {
    if (category === 'all') return true;
    if (category === 'featured') return project.featured === true;

    // Handle both single category strings and arrays of categories
    const projectCategories = Array.isArray(project.category)
      ? project.category
      : project.category ? [project.category] : [];

    return projectCategories.includes(category);
  });
}
