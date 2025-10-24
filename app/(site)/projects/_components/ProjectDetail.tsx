'use client';

import { ProjectMeta } from '../_lib/mdx';
import { OptimizedImage } from '@components/media';
import ResponsiveVideo from './ResponsiveVideo';

interface ProjectDetailProps {
  meta: ProjectMeta;
  mdxContent?: React.ReactNode;
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

const SectionDivider = () => (
  <div
    className="w-full h-px my-8"
    style={{
      background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent 100%)'
    }}
  />
);

export default function ProjectDetail({ meta, mdxContent }: ProjectDetailProps) {
  // Build metadata sections
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
    // Only show description if there's no MDX content
    !mdxContent && meta.description && {
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
    (meta.link || meta.video) && {
      id: 'links',
      content: (
        <div className="flex flex-wrap gap-3">
          {meta.link && (
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
          )}
          {meta.video && (
            <a
              href={meta.video}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors underline text-sm sm:text-base"
            >
              Watch Video
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </a>
          )}
        </div>
      )
    }
  ].filter(Boolean) as Section[];

  return (
    <div className="flex flex-col pb-8 lg:flex-row lg:gap-20 w-full overflow-x-hidden">
      {/* Left section - Project Details */}
      <div
        className="w-full lg:w-1/3 lg:min-w-[450px] lg:pr-8 lg-h-screen-dynamic-minus-nav lg:overflow-auto scrollbar-hide overflow-x-hidden pb-8 lg:pb-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Metadata Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="animate-crop-down"
              style={{
                animationDelay: `${index * 50}ms`,
                opacity: 0,
                animationFillMode: 'forwards',
              }}
            >
              {section.id === 'title' || section.id === 'links' ? (
                section.content
              ) : (
                <InfoSection label={section.label!}>{section.content}</InfoSection>
              )}
            </div>
          ))}
        </div>

        {/* Visual Separator */}
        {mdxContent && (
          <div
            className="animate-crop-down"
            style={{
              animationDelay: `${sections.length * 50}ms`,
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <SectionDivider />
          </div>
        )}

        {/* MDX Content */}
        {mdxContent && (
          <div
            className="animate-crop-down"
            style={{
              animationDelay: `${(sections.length + 1) * 50}ms`,
              opacity: 0,
              animationFillMode: 'forwards',
            }}
          >
            <div className="prose prose-invert max-w-none">
              {mdxContent}
            </div>
          </div>
        )}
      </div>

      {/* Right section - Media Viewer */}
      <div
        className="w-full lg:w-2/3 lg:max-w-[1024px] lg-h-screen-dynamic-minus-nav lg:overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4 scrollbar-hide"
        style={{
          animation: 'fadeIn 0.8s ease-out',
          animationDelay: '200ms',
          opacity: 0,
          animationFillMode: 'forwards',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Media Array (mixed images and videos) */}
        {meta.media.map((mediaUrl, index) => {
          const isVideo = mediaUrl.toLowerCase().match(/\.(mp4|webm|mov|avi|ogg)$/);

          return isVideo ? (
            <ResponsiveVideo
              key={`${meta.slug}-media-${index}`}
              src={mediaUrl}
              className="w-full max-w-full rounded"
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
              className="w-full max-w-full rounded"
            />
          );
        })}
      </div>
    </div>
  );
}

