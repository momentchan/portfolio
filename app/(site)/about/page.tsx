import Scene from '@/app/(site)/about/components/Scene';
import AboutContent from '@/app/(site)/about/components/AboutContent';

export default function AboutPage() {
  return (
    <>
      {/* 3D Scene Background */}
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>

      <AboutContent />
    </>
  );
}
