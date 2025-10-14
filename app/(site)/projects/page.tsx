import { getAllProjects } from "@/lib/mdx";
import ContentOverlay from '@/components/layout/ContentOverlay';
import ProjectsFilter from '@/components/ui/ProjectsFilter';

export const revalidate = 60;

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  return (
    <div className="max-w-4xl mx-auto py-10 h-screen overflow-hidden flex flex-col">
      <ContentOverlay className="!overflow-hidden !max-h-none flex flex-col">
        <h1 className="text-2xl font-semibold mb-6">Projects</h1>
        <ProjectsFilter projects={projects} />
      </ContentOverlay>
    </div>
  );
}
