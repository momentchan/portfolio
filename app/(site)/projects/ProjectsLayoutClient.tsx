'use client';

import { usePathname } from 'next/navigation';
import { ProjectMeta } from '@/lib/mdx';
import PersistentMediaViewer from './PersistentMediaViewer';

interface ProjectsLayoutClientProps {
    children: React.ReactNode;
    projects: ProjectMeta[];
}

export default function ProjectsLayoutClient({ children, projects }: ProjectsLayoutClientProps) {
    const pathname = usePathname();

    // Check if we're on a project detail page
    const isDetailPage = pathname.startsWith('/projects/') && pathname !== '/projects';

    return (
        <div className="flex flex-col lg:flex-row h-screen lg:gap-20">
            {/* Left section - Content (projects list or detail) */}
            <div className={`w-full lg:w-1/3 lg:min-w-[450px] overflow-hidden flex-shrink-0`}>
                {children}
            </div>

            {/* Right section - Persistent Media Viewer (hidden on projects list mobile, shown on detail page and desktop) */}
            <div className={`w-full lg:w-1/3 lg:max-w-[1000px] flex-1 lg:h-screen flex items-center justify-center lg:overflow-hidden ${isDetailPage ? 'flex' : 'hidden lg:flex'}`}>
                <PersistentMediaViewer projects={projects} />
            </div>
        </div>
    );
}

