import { MDXComponents } from 'mdx/types';
import OptimizedImage from './OptimizedImage';

/**
 * Custom MDX components for project content
 * These replace default HTML elements with styled versions
 */
export const mdxComponents: MDXComponents = {
    // Headings
    h1: ({ children }) => (
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 mt-8 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 mt-8">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 mt-6">
            {children}
        </h3>
    ),

    // Paragraphs
    p: ({ children }) => (
        <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-4">
            {children}
        </p>
    ),

    // Lists
    ul: ({ children }) => (
        <ul className="text-white/80 text-sm sm:text-base space-y-2 mb-4 list-disc list-inside">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="text-white/80 text-sm sm:text-base space-y-2 mb-4 list-decimal list-inside">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="ml-2">{children}</li>
    ),

    // Inline elements
    strong: ({ children }) => (
        <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-white/90">{children}</em>
    ),

    // Code
    code: ({ children }) => (
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm text-white/90 font-mono">
            {children}
        </code>
    ),
    pre: ({ children }) => (
        <pre className="bg-white/5 p-4 rounded overflow-x-auto mb-4">
            {children}
        </pre>
    ),

    // Links
    a: ({ href, children }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline hover:text-white/80 transition-colors"
        >
            {children}
        </a>
    ),

    // Blockquote
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-white/30 pl-4 italic text-white/70 my-4">
            {children}
        </blockquote>
    ),

    // Horizontal rule
    hr: () => (
        <hr className="border-t border-white/20 my-8" />
    ),

    // Images (use OptimizedImage)
    img: ({ src, alt }) => (
        <OptimizedImage
            path={src || ''}
            alt={alt || ''}
            width={1600}
            height={900}
            className="w-full rounded my-6"
        />
    ),
};

