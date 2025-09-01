import { getAllProjects } from "@/lib/mdx";

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <main className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <ul className="space-y-4">
        {projects.map(p => (
          <li key={p.slug}>
            <a className="underline" href={`/projects/${p.slug}`}>{p.title}</a>
            {p.summary && <div className="text-sm opacity-70">{p.summary}</div>}
          </li>
        ))}
      </ul>
    </main>
  );
}
