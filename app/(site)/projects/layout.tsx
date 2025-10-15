import { getAllProjects } from "@/lib/mdx";
import PersistentMediaViewer from './PersistentMediaViewer';

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const projects = await getAllProjects();
  
  return (
    <div className="flex h-screen gap-30">
      {/* Left half - Content (projects list or detail) */}
      <div className="w-1/3 overflow-hidden">
        {children}
      </div>
      
      {/* Right half - Persistent Media Viewer */}
      <div className="w-1/3 h-screen flex items-center justify-center">
        <PersistentMediaViewer projects={projects} />
      </div>
    </div>
  );
}

