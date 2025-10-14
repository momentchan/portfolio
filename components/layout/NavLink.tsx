'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  
  // Preserve existing query parameters
  const queryString = searchParams.toString();
  const fullHref = queryString ? `${href}?${queryString}` : href;
  
  return (
    <Link href={fullHref} className={className}>
      {children}
    </Link>
  );
}

