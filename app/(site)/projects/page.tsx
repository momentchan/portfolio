import { getAllProjects } from "@/lib/mdx";
import ProjectsFilter from './ProjectsFilter';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <ProjectsFilter projects={projects} />
    </div>
  );
}
