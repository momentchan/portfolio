import { ReactNode } from 'react';

export default function AboutLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <div className="flex-1 flex flex-col">
                {children}
                {/* Sticky footer for about page */}
            </div>
            <div className="sticky bottom-0 bg-transparent backdrop-blur-0 text-xs lg:text-sm text-white/60 pb-4 z-30">
                © 2025
            </div>
        </>
    );
}