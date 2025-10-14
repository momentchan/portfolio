import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
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
          <h1 className="text-4xl font-bold text-white mb-4">{meta.title}</h1>
          
          {/* Meta info */}
          <div className="mb-6 space-y-3">
            {meta.summary && (
              <p className="text-white/70 text-lg">{meta.summary}</p>
            )}
            
            {/* Role */}
            {meta.role && meta.role.length > 0 && (
              <div className="space-y-1">
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
            
            {meta.date && (
              <p className="text-white/50 text-sm">
                {new Date(meta.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
            
            {meta.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm">
                {meta.category}
              </span>
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
          </div>

          {/* MDX Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none text-white/80">
            <MDXRemote 
              source={content} 
              options={{ 
                mdxOptions: { 
                  remarkPlugins: [remarkGfm], 
                  rehypePlugins: [rehypeSlug] 
                } 
              }} 
            />
          </div>
        </article>
      </div>
    </div>
  );
}
