import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content");

export type CategoryType = 'web' | 'experiential' | 'lab';

export type ProjectMeta = {
  title: string; slug: string; date: string;
  summary?: string; 
  description?: string; // Detailed project description
  tags?: string[];
  category?: CategoryType | CategoryType[];
  featured?: boolean; // Featured project flag (default: false)
  cover: string; // Cover media for project list - can be image or video URL
  media: string[]; // Combined media array (images and videos) - supports both local paths and URLs
  role?: string[]; // Roles like ["Fullstack Creative Development", "Motion"]
  link?: string; // Website URL
  enabled?: boolean; // Show/hide project (default: true)
  file: string;
  _filename?: string; // Internal: used for filename-based sorting
};

function extractFrontmatter(src: string): { data: any; content: string; hasContent: boolean } {
  // Check if file uses JavaScript export format (legacy)
  if (src.startsWith('export const frontmatter')) {
    try {
      // Find the opening brace
      const startIndex = src.indexOf('{');
      if (startIndex === -1) return { data: {}, content: '', hasContent: false };
      
      // Find the matching closing brace
      let braceCount = 0;
      let endIndex = -1;
      for (let i = startIndex; i < src.length; i++) {
        if (src[i] === '{') braceCount++;
        if (src[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
      }
      
      if (endIndex !== -1) {
        const objStr = src.substring(startIndex, endIndex);
        // Use Function constructor to safely evaluate the object literal
        const frontmatter = new Function(`'use strict'; return (${objStr})`)();
        return { data: frontmatter, content: '', hasContent: false };
      }
    } catch (e) {
      console.error('Failed to parse JavaScript frontmatter:', e);
      return { data: {}, content: '', hasContent: false };
    }
  }
  
  // Parse YAML frontmatter with gray-matter
  const parsed = matter(src);
  const hasContent = parsed.content.trim().length > 0;
  return { data: parsed.data, content: parsed.content, hasContent };
}

export async function getAllProjects(): Promise<ProjectMeta[]> {
  const dir = path.join(ROOT, "projects");
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".mdx"));
  const metas: ProjectMeta[] = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const src = await fs.readFile(full, "utf8");
    const { data } = extractFrontmatter(src);
    // Set enabled to true and featured to false by default if not specified
    const meta = { enabled: true, featured: false, ...(data as any), file: full, _filename: file };
    metas.push(meta);
  }
  return metas
    .filter(m => m.enabled !== false) // Only show enabled projects
    .sort((a,b) => {
      // Sort by filename (supports patterns like 01-project.mdx, 02-another.mdx)
      // This allows easy reordering by renaming files
      if (a._filename && b._filename) {
        return a._filename.localeCompare(b._filename);
      }
      // Fallback to date sorting
      return +new Date(b.date) - +new Date(a.date);
    });
}

export async function getProjectBySlug(slug: string) {
  const metas = await getAllProjects();
  const meta = metas.find(m => m.slug === slug);
  if (!meta) return null;
  const src = await fs.readFile(meta.file, "utf8");
  
  // Extract content and check if it exists
  const { content, hasContent } = extractFrontmatter(src);
  
  return { meta, content, hasContent };
}
