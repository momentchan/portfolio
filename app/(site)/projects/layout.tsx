export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 min-h-0">
      {children}
      {/* Normal footer for projects page */}
      <div className="text-xs lg:text-sm text-white/60 pb-4 z-30">
        © 2025
      </div>
    </div>
  );
}

