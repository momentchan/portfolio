import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { getAllProjects, getProjectBySlug } from "@/lib/mdx";

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.map(p => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const data = await getProjectBySlug(params.slug);
  if (!data) return null;
  const { meta, content } = data;

  return (
    <article className="prose mx-auto py-10">
      <h1>{meta.title}</h1>
      <MDXRemote source={content} options={{ mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] } }} />
    </article>
  );
}
