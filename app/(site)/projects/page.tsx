import { getAllProjects } from "@/lib/mdx";
import Link from "next/link";
import ContentOverlay from '@/components/layout/ContentOverlay';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div className="max-w-2xl mx-auto py-20">
      <ContentOverlay>
        <h1 className="text-2xl font-semibold mb-6">Projects</h1>
        <ul className="space-y-4">
          {projects.map(p => (
            <li key={p.slug}>
              <Link className="underline hover:no-underline" href={`/projects/${p.slug}`}>
                {p.title}
              </Link>
              {p.summary && <div className="text-sm opacity-70">{p.summary}</div>}
            </li>
          ))}
        </ul>
      </ContentOverlay>
    </div>
  );
}
