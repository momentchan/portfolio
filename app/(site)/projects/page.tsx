import { getAllProjects } from "@/lib/mdx";
import ProjectsFilter from '@/components/ui/ProjectsFilter';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div className="px-10 py-10 h-full overflow-hidden flex flex-col">
      <h1 className="text-2xl font-semibold mb-6 text-white">Projects</h1>
      <ProjectsFilter projects={projects} />
    </div>
  );
}
