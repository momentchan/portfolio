'use client';

import { ProjectMeta } from '@/lib/mdx';

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
    <div className="text-white/50 text-xs uppercase tracking-wider">{label}</div>
    <div className="text-white/80">{children}</div>
  </div>
);

export default function ProjectDetail({ meta }: ProjectDetailProps) {
  const sections: Section[] = [
    {
      id: 'title',
      content: <h1 className="text-4xl font-bold text-white">{meta.title}</h1>
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
        <div className="flex flex-wrap gap-2">
          {meta.tags.map(tag => (
            <span key={tag} className="inline-block px-2 py-1 rounded bg-white/5 text-white/60 text-xs">
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
          className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors underline"
        >
          Visit Website
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )
    }
  ].filter(Boolean) as Section[];

  return (
    <div>
      {sections.map((section, index) => (
        <div
          key={section.id}
          className="animate-crop-down"
          style={{
            animationDelay: `${index * 50}ms`,
            opacity: 0,
            animationFillMode: 'forwards',
            marginBottom: section.id === 'title' ? '2rem' : '3rem'
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
  );
}

