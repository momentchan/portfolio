import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { getAllProjects, getProjectBySlug } from "@/lib/mdx";
import ContentOverlay from '@/components/layout/ContentOverlay';

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map(p => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const data = await getProjectBySlug(params.slug);
  if (!data) return null;
  const { meta, content } = data;

  return (
    <div className="max-w-3xl mx-auto py-20">
      <ContentOverlay>
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1>{meta.title}</h1>
          <MDXRemote 
            source={content} 
            options={{ 
              mdxOptions: { 
                remarkPlugins: [remarkGfm], 
                rehypePlugins: [rehypeSlug] 
              } 
            }} 
          />
        </article>
      </ContentOverlay>
    </div>
  );
}
