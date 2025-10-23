import { getAllProjects, getProjectBySlug } from "@/lib/mdx";
import Link from 'next/link';
import ProjectDetail from '../_components/ProjectDetail';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '../_components/MDXComponents';

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map(p => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) return null;
  const { meta, content, hasContent } = data;

  // Render MDX content on the server
  const mdxContent = hasContent && content ? (
    <div className="prose prose-invert max-w-none">
      <MDXRemote source={content} components={mdxComponents} />
    </div>
  ) : null;

  return (
    <div className="h-full overflow-hidden overflow-x-hidden flex flex-col">
      {/* Back button */}
      <Link href="/projects" className="text-white/60 hover:text-white py-2 mb-6 inline-block w-fit text-sm flex-shrink-0">
        ← Back to Projects
      </Link>

      {/* Project info */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide w-full" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <ProjectDetail meta={meta} mdxContent={mdxContent} />
      </div>
    </div>
  );
}
