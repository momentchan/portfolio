import Scene from '@/components/r3f/Scene';
import LoadingPage from '@/components/LoadingPage';
import UICanvas from '@/components/ui/UICanvas';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <LoadingPage />

      {/* Fullscreen background - Canvas loads in background */}
      <div className="fixed inset-0 z-0">
        <Scene />
        <UICanvas />
      </div>

      {/* Foreground content */}
      {/* <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pointer-events-none">
        <h1 className="text-3xl font-bold mb-4 select-none">
        Seen. Felt. Remembered.
        </h1>
        <p className="text-lg text-gray-600 select-none">
          From Attention to Memory.
        </p>
      </main> */}
    </div>
  );
}
