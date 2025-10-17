'use client';

import { ProjectMeta } from '@/lib/mdx';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface ProjectDetailProps {
  meta: ProjectMeta;
}

interface Section {
  id: string;
  label?: string;
  content: React.ReactNode;
}

const InfoSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="text-white/50 text-[10px] sm:text-xs uppercase tracking-wider">{label}</div>
    <div className="text-white/80 text-sm sm:text-base">{children}</div>
  </div>
);

export default function ProjectDetail({ meta }: ProjectDetailProps) {
  const sections: Section[] = [
    {
      id: 'title',
      content: <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{meta.title}</h1>
    },
    meta.role && meta.role.length > 0 && {
      id: 'role',
      label: 'Role',
      content: meta.role.map((r, i) => (
        <span key={r}>
          {r}
          {i < meta.role!.length - 1 && <span className="text-white/40"> / </span>}
        </span>
      ))
    },
    meta.summary && {
      id: 'summary',
      label: 'Summary',
      content: <p>{meta.summary}</p>
    },
    meta.description && {
      id: 'description',
      label: 'Description',
      content: (
        <div className="space-y-4">
          {meta.description.split('\n').filter(p => p.trim()).map((para, i) => (
            <p key={i}>{para.trim()}</p>
          ))}
        </div>
      )
    },
    meta.tags && meta.tags.length > 0 && {
      id: 'tags',
      label: 'Tags',
      content: (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {meta.tags.map(tag => (
            <span key={tag} className="inline-block px-2 py-1 rounded bg-white/5 text-white/60 text-[10px] sm:text-xs">
              {tag}
            </span>
          ))}
        </div>
      )
    },
    meta.link && {
      id: 'link',
      content: (
        <a
          href={meta.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors underline text-sm sm:text-base"
        >
          Visit Website
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )
    }
  ].filter(Boolean) as Section[];

  return (
    <div className="flex flex-col lg:flex-row lg:gap-20 h-screen">
      {/* Left section - Project Details */}
      <div className="pb-8 sm:pb-0 min-w-[450px] lg:w-1/3 lg:pr-8">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="animate-crop-down"
            style={{
              animationDelay: `${index * 50}ms`,
              opacity: 0,
              animationFillMode: 'forwards',
              marginBottom: section.id === 'title' ? '1.5rem' : '2rem'
            }}
          >
            {section.id === 'title' || section.id === 'link' ? (
              section.content
            ) : (
              <InfoSection label={section.label!}>{section.content}</InfoSection>
            )}
          </div>
        ))}
      </div>

      {/* Right section - Media Viewer */}
      <div className="w-full lg:w-1/2 lg:h-[calc(100dvh-20rem)] lg:overflow-hidden">
        <div
          className="w-full h-full space-y-3 sm:space-y-4 scrollbar-hide overflow-y-auto pb-16"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Media Array (mixed images and videos) */}
          {meta.media.map((mediaUrl, index) => {
            const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|mov|avi|ogg)$/);

            return isVideo ? (
              <video
                key={`${meta.slug}-media-${index}`}
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded"
              />
            ) : (
              <OptimizedImage
                key={`${meta.slug}-media-${index}`}
                path={mediaUrl}
                alt={`${meta.title} - ${index + 1}`}
                width={1600}
                height={900}
                loading={index < 2 ? 'eager' : 'lazy'}
                priority={index === 0}
                className="w-full rounded"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

