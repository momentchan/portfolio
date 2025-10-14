import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { getAllProjects, getProjectBySlug } from "@/lib/mdx";
import ContentOverlay from '@/components/layout/ContentOverlay';
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
    <div className="max-w-4xl mx-auto py-10 h-screen overflow-hidden flex flex-col">
      <ContentOverlay className="!overflow-hidden !max-h-none flex flex-col">
        {/* Back button */}
        <Link href="/projects" className="text-white/60 hover:text-white mb-6 inline-block">
          ← Back to Projects
        </Link>

        {/* Split screen layout */}
        <div className="flex gap-8 h-[70vh]">
          {/* Left half - Project info */}
          <div className="w-1/2 border-r border-white/10 pr-8 overflow-y-auto scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            <article>
              <h1 className="text-4xl font-bold text-white mb-4">{meta.title}</h1>
              
              {/* Meta info */}
              <div className="mb-6 space-y-2">
                {meta.summary && (
                  <p className="text-white/70 text-lg">{meta.summary}</p>
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

          {/* Right half - Media preview */}
          <div className="w-1/2 flex items-center justify-center overflow-hidden">
            {(meta.videos || meta.images) && (
              <div className="w-full h-full overflow-y-auto p-8 space-y-4 scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}>
                {/* Videos */}
                {meta.videos && meta.videos.length > 0 && (
                  meta.videos.map((video, index) => (
                    <video
                      key={`video-${index}`}
                      src={video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full rounded"
                    />
                  ))
                )}
                
                {/* Images */}
                {meta.images && meta.images.length > 0 && (
                  meta.images.map((image, index) => (
                    <img
                      key={`image-${index}`}
                      src={image}
                      alt={`${meta.title} - ${index + 1}`}
                      className="w-full rounded"
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </ContentOverlay>
    </div>
  );
}
