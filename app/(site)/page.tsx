import Scene from '@/components/r3f/Scene';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      {/* Fullscreen background */}
      <div className="fixed inset-0 z-0">
        <Scene />
      </div>

      {/* Foreground content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pointer-events-none">
        <h1 className="text-4xl font-bold mb-4 select-none">
          Ming Jyun Hung
        </h1>
        <p className="text-lg text-gray-600 mb-8 select-none">
          Creative Developer · Technical Artist · Interactive Designer
        </p>
      </main>
    </div>
  );
}
