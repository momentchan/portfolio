import Scene from '@/components/scene-about/Scene';
import AboutContent from '@/components/scene-about/AboutContent';

export default function AboutPage() {
  return (
    <>
      {/* 3D Scene Background */}
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>

      {/* Content */}
      <div className="relative z-10 lg:pointer-events-none">
        <AboutContent />
      </div>
    </>
  );
}
