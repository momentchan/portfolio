import { getAllProjects, getProjectBySlug } from "@/lib/mdx";
import Link from 'next/link';

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map(p => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const data = await getProjectBySlug(params.slug);
  if (!data) return null;
  const { meta, content } = data;

  return (
    <div className="px-10 py-10 h-full overflow-hidden flex flex-col">
      {/* Back button */}
      <Link href="/projects" className="text-white/60 hover:text-white mb-6 inline-block">
        ← Back to Projects
      </Link>

      {/* Project info */}
      <div className="overflow-y-auto scrollbar-hide" style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <article>
          <h1 className="text-4xl font-bold text-white mb-8">{meta.title}</h1>

          {/* Meta info */}
          <div className="mb-6 space-y-12">
            {/* Role */}
            {meta.role && meta.role.length > 0 && (
              <div className="space-y-2">
                <div className="text-white/50 text-xs uppercase tracking-wider">Role</div>
                <div className="text-white/80">
                  {meta.role.map((r, i) => (
                    <span key={r}>
                      {r}
                      {i < meta.role!.length - 1 && <span className="text-white/40"> / </span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {meta.summary && (
              <div className="space-y-1">
                <div className="text-white/50 text-xs uppercase tracking-wider">Summary</div>
                <p className="text-white/70 text-lg">{meta.summary}</p>
              </div>
            )}

            {/* Description */}
            {meta.description && (
              <div className="space-y-1">
                <div className="text-white/50 text-xs uppercase tracking-wider">Description</div>
                <p className="text-white/70">{meta.description}</p>
              </div>
            )}

            {meta.tags && meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {meta.tags.map(tag => (
                  <span key={tag} className="inline-block px-2 py-1 rounded bg-white/5 text-white/60 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Visit Website Link */}
            {meta.link && (
              <div>
                <a
                  href={meta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors underline"
                >
                  Visit Website
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}

          </div>
        </article>
      </div>
    </div>
  );
}
