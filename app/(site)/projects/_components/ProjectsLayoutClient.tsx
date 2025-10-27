'use client';

import { useEffect } from 'react';
import { useSelectedLayoutSegments } from 'next/navigation';
import ProjectList from './ProjectList';
import type { ProjectMeta } from '../_lib/mdx';

type Props = {
    projects: ProjectMeta[];
    children: React.ReactNode;
};

export default function ProjectsLayoutClient({ projects, children }: Props) {
    const segments = useSelectedLayoutSegments();
    const inDetail = segments.length > 0;

    // Restore parent scroll when returning from detail
    useEffect(() => {
        if (inDetail) return;
        try {
            const shouldRestore = sessionStorage.getItem('restoreProjectsScroll') === '1';
            const saved = sessionStorage.getItem('projectsScrollY');
            if (shouldRestore && saved) {
                const y = parseInt(saved, 10) || 0;
                const main = document.querySelector('main') as HTMLElement | null;
                if (main) {
                    main.scrollTop = y;
                } else {
                    window.scrollTo(0, y);
                }
                sessionStorage.removeItem('restoreProjectsScroll');
            }
        } catch { }
    }, [inDetail]);

    return (
        <div className="relative">
            <div style={{ display: inDetail ? 'none' : 'block' }}>
                <ProjectList projects={projects} />
            </div>

            <div>
                {children}
            </div>
        </div>
    );
}


