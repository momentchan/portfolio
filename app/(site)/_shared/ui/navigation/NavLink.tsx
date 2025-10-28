'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode, Suspense } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  showUnderline?: boolean;
}

function NavLinkInner({ href, children, className, showUnderline = true }: NavLinkProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Check if this link is active (exclude home page)
  const isActive = href !== '/' && (pathname === href || pathname.startsWith(href + '/'));

  // Preserve existing query parameters
  const queryString = searchParams.toString();
  const fullHref = queryString ? `${href}?${queryString}` : href;

  // Remove underline from className since we're using custom underline
  const cleanClassName = className || '';

  // Prevent navigation if already on the target page
  const handleClick = (e: React.MouseEvent) => {
    if (pathname === href) {
      e.preventDefault();
      return false;
    }
  };

  return (
    <Link
      href={fullHref}
      className={`group relative ${cleanClassName}`.trim()}
      style={{
        textDecoration: 'none',
      }}
      onClick={handleClick}
    >
      <span className="relative inline-block">
        {children}
        {showUnderline && (
          <span
            className={`absolute bottom-0 left-0 h-px bg-current transition-all duration-300 ease-out ${isActive ? 'w-full' : 'w-0 group-hover:w-full'
              }`}
          />
        )}
      </span>
    </Link>
  );
}

/**
 * Navigation link that preserves query parameters (like ?dev=true)
 */
export default function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<Link href={props.href} className={props.className}>{props.children}</Link>}>
      <NavLinkInner {...props} />
    </Suspense>
  );
}

