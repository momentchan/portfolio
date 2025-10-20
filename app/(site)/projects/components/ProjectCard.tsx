import Link from 'next/link';
import { ProjectMeta, getCoverMedia } from './projectHelpers';
import ProjectMedia from './ProjectMedia';

interface ProjectCardProps {
    project: ProjectMeta;
    isLoading: boolean;
    shouldLoad: boolean;
    isVisible: boolean;
    setItemRef: (slug: string) => (element: HTMLElement | null) => void;
    onLoadStart: (slug: string) => void;
    onLoad: (slug: string) => void;
    onError: (slug: string) => void;
    onMouseEnter: (project: ProjectMeta, element: HTMLElement) => void;
    onMouseLeave: () => void;
}

export default function ProjectCard({
    project,
    isLoading,
    shouldLoad,
    isVisible,
    setItemRef,
    onLoadStart,
    onLoad,
    onError,
    onMouseEnter,
    onMouseLeave,
}: ProjectCardProps) {
    const cover = getCoverMedia(project);
    const hasCover = cover.url !== null;

    return (
        <li
            key={project.slug}
            ref={setItemRef(project.slug)}
            data-project-slug={project.slug}
        >
            <Link
                href={`/projects/${project.slug}`}
                className="flex flex-col gap-2 text-xs sm:text-sm text-white transition-colors lg:text-white"
            >
                {hasCover && (
                    <ProjectMedia
                        project={project}
                        cover={cover}
                        isLoading={isLoading}
                        shouldLoad={shouldLoad}
                        isVisible={isVisible}
                        onLoadStart={onLoadStart}
                        onLoad={onLoad}
                        onError={onError}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                )}

                <div className="flex flex-col gap-2 pt-2 sm:pt-4 lg:pt-6">
                    <span>{project.title}</span>

                    {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {project.tags.map(tag => (
                                <span
                                    key={tag}
                                    className="inline-block px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] sm:text-xs"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        </li>
    );
}
