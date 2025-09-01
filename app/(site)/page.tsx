export default function HomePage() {
    return (
      <main className="max-w-3xl mx-auto py-20 px-6 text-center">
        {/* Hero 區塊 */}
        <h1 className="text-4xl font-bold mb-4">
          Hi, I’m <span className="text-blue-600">Your Name</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Creative Developer · Technical Artist · Interactive Designer
        </p>
  
        {/* 導航按鈕 */}
        <div className="flex justify-center gap-6">
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
        </div>
      </main>
    );
  }
  