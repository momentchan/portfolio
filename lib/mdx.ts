import { promises as fs } from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.join(process.cwd(), "content");

export type ProjectMeta = {
  title: string; slug: string; date: string;
  summary?: string; tags?: string[];
  category?: 'web' | 'spatial';
  images?: string[]; // Supports both local paths ("/images/...") and external URLs ("https://...")
  videos?: string[]; // Supports both local paths ("/videos/...") and external URLs ("https://...")
  file: string;
};

export async function getAllProjects(): Promise<ProjectMeta[]> {
  const dir = path.join(ROOT, "projects");
  const files = (await fs.readdir(dir)).filter(f => f.endsWith(".mdx"));
  const metas: ProjectMeta[] = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const src = await fs.readFile(full, "utf8");
    const { data } = matter(src);
    metas.push({ ...(data as any), file: full });
  }
  return metas.sort((a,b) => +new Date(b.date) - +new Date(a.date));
}

export async function getProjectBySlug(slug: string) {
  const metas = await getAllProjects();
  const meta = metas.find(m => m.slug === slug);
  if (!meta) return null;
  const src = await fs.readFile(meta.file, "utf8");
  const parsed = matter(src);
  return { meta, content: parsed.content };
}
