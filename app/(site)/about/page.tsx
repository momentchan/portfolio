import Scene from '@/app/(site)/about/components/Scene';
import AboutContent from '@/app/(site)/about/components/AboutContent';

export default function AboutPage() {
  return (
    <div className="h-full">
      {/* 3D Scene Background */}
      <div className="fixed inset-0 z-0 transition-opacity duration-2000">
        <Scene />
      </div>
      <AboutContent />
    </div>
  );
}
