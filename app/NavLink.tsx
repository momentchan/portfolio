'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Navigation link that preserves query parameters (like ?dev=true)
 */
export default function NavLink({ href, children, className }: NavLinkProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Check if this link is active (exclude home page)
  const isActive = href !== '/' && (pathname === href || pathname.startsWith(href + '/'));
  
  // Preserve existing query parameters
  const queryString = searchParams.toString();
  const fullHref = queryString ? `${href}?${queryString}` : href;
  
  // Combine classes with underline for active state
  const combinedClassName = `${className || ''} ${isActive ? 'underline' : ''}`.trim();
  
  return (
    <Link href={fullHref} className={combinedClassName}>
      {children}
    </Link>
  );
}

