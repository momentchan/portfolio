import { getAllProjects } from "./_lib/mdx";
import ProjectsLayoutClient from './_components/ProjectsLayoutClient';

export const revalidate = 60;

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getAllProjects();
  return (
    <div className="flex-1 min-h-0">
      <ProjectsLayoutClient projects={projects}>
        {children}
      </ProjectsLayoutClient>
      {/* Normal footer for projects page */}
      <div className="text-xs lg:text-sm text-white/60 pb-4 z-30">
        © 2025
      </div>
    </div>
  );
}

