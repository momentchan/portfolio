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
          Hi, I'm Ming Jyun Hung
        </h1>
        <p className="text-lg text-gray-600 mb-8 select-none">
          Creative Developer · Technical Artist · Interactive Designer
        </p>

        {/* Example: buttons (need to re-enable events here) */}
        {/* <div className="flex gap-6 pointer-events-auto">
          <a
            href="/projects"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            View Projects
          </a>
          <a
            href="/about"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            About Me
          </a>
        </div> */}
      </main>
    </div>
  );
}
