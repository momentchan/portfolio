'use client';

import NavLink from './NavLink';

/**
 * Main navigation header with query parameter preservation
 */
export default function Navigation() {
  return (
    <header className="relative z-20 w-full px-10 py-10 flex justify-between items-center">
      
      <NavLink href="/" className="text-lg font-bold">
        Ming Jyun Hung
      </NavLink>
      <nav className="flex gap-6">
        <NavLink href="/projects" className="hover:underline">Projects</NavLink>
        <NavLink href="/about" className="hover:underline">About</NavLink>
      </nav>
    </header>
  );
}

