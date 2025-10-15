import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content");

export type ProjectMeta = {
  title: string; slug: string; date: string;
  summary?: string; 
  description?: string; // Detailed project description
  tags?: string[];
  category?: 'web' | 'experiential';
  images?: string[]; // Supports both local paths ("/images/...") and external URLs ("https://...")
  videos?: string[]; // Supports both local paths ("/videos/...") and external URLs ("https://...")
  role?: string[]; // Roles like ["Fullstack Creative Development", "Motion"]
  link?: string; // Website URL
  enabled?: boolean; // Show/hide project (default: true)
  file: string;
  _filename?: string; // Internal: used for filename-based sorting
};

function extractFrontmatter(src: string): any {
  // Check if file uses JavaScript export format
  if (src.startsWith('export const frontmatter')) {
    try {
      // Find the opening brace
      const startIndex = src.indexOf('{');
      if (startIndex === -1) return {};
      
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
        return frontmatter;
      }
    } catch (e) {
      console.error('Failed to parse JavaScript frontmatter:', e);
      return {};
    }
  }
  
  // Fall back to YAML frontmatter
  const { data } = matter(src);
  return data;
}

export async function getAllProjects(): Promise<ProjectMeta[]> {
  const dir = path.join(ROOT, "projects");
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".mdx"));
  const metas: ProjectMeta[] = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const src = await fs.readFile(full, "utf8");
    const data = extractFrontmatter(src);
    // Set enabled to true by default if not specified
    const meta = { enabled: true, ...(data as any), file: full, _filename: file };
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
  
  // Extract content (remove frontmatter export or YAML)
  let content = src;
  if (src.startsWith('export const frontmatter')) {
    // Remove JavaScript export frontmatter
    content = src.replace(/^export const frontmatter = {[\s\S]*?}\n+/m, '');
  } else {
    // Use gray-matter for YAML frontmatter
    const parsed = matter(src);
    content = parsed.content;
  }
  
  return { meta, content };
}
