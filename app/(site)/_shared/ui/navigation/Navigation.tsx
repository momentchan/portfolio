'use client';

import NavLink from './NavLink';

/**
 * Main navigation header with query parameter preservation
 */
export default function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-10 flex justify-between items-center mix-blend-difference select-none pointer-events-none">

      <NavLink
        href="/"
        className="text-base sm:text-lg font-bold pointer-events-auto"
        showUnderline={false}
      >
        Ming Jyun Hung
      </NavLink>

      <nav className="flex gap-4 sm:gap-6 pointer-events-auto">
        <NavLink href="/projects" className="text-sm sm:text-base">
          Projects
        </NavLink>
        <NavLink href="/about" className="text-sm sm:text-base">
          About
        </NavLink>
      </nav>
    </header>
  );
}

