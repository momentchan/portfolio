import OptimizedImage from '@/components/ui/OptimizedImage';
import { ProjectMeta, getCoverMedia } from '../utils/projectHelpers';

interface ProjectMediaProps {
    project: ProjectMeta;
    cover: ReturnType<typeof getCoverMedia>;
    isLoading: boolean;
    shouldLoad: boolean;
    isVisible: boolean;
    onLoadStart: (slug: string) => void;
    onLoad: (slug: string) => void;
    onError: (slug: string) => void;
    onMouseEnter: (project: ProjectMeta, element: HTMLElement) => void;
    onMouseLeave: () => void;
}

export default function ProjectMedia({
    project,
    cover,
    isLoading,
    shouldLoad,
    isVisible,
    onLoadStart,
    onLoad,
    onError,
    onMouseEnter,
    onMouseLeave,
}: ProjectMediaProps) {
    const { url, isVideo } = cover;

    if (!url) return null;

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseEnter(project, e.currentTarget);
    };

    return (
        <div
            className="relative w-full aspect-video lg:aspect-square overflow-hidden rounded bg-white/5"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                </div>
            )}

            {shouldLoad && isVideo ? (
                <video
                    key={url}
                    src={url}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                    autoPlay={shouldLoad}
                    loop
                    muted
                    playsInline
                    onLoadStart={() => onLoadStart(project.slug)}
                    onLoadedData={() => onLoad(project.slug)}
                    onCanPlay={() => onLoad(project.slug)}
                    onError={() => onError(project.slug)}
                    onPause={(e) => {
                        // Prevent pause, keep playing
                        const video = e.currentTarget;
                        if (video.paused) {
                            video.play().catch(() => { });
                        }
                    }}
                />
            ) : shouldLoad ? (
                <OptimizedImage
                    path={url}
                    alt={project.title}
                    fill
                    className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                        }`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    preset="medium"
                    loading={isVisible ? 'eager' : 'lazy'}
                    onLoad={() => onLoad(project.slug)}
                    onError={() => onError(project.slug)}
                />
            ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/10 rounded-full"></div>
                </div>
            )}
        </div>
    );
}
