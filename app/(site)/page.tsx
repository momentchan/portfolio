import Scene from '@/components/r3f/Scene';


export default function HomePage() {
  return (
    <main className="max-w-3xl mx-auto py-20 px-6 text-center">

      {/* background canvas */}
      <div className="absolute inset-0">
        <Scene />
      </div>

      {/* Hero block */}
      <h1 className="text-4xl font-bold mb-4">
        Hi, I'm <span className="text-blue-600">Ming Jyun Hung</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Creative Developer · Technical Artist · Interactive Designer
      </p>

      {/* Font Showcase */}
      {/* <div className="mb-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-medium mb-4">Pragmatica Font Preview</h2>
        <div className="space-y-2 text-left">
          <p className="font-light">Light weight (300) - This is how light text will look</p>
          <p className="font-normal">Book weight (400) - This is how regular text will look</p>
          <p className="font-bold">Bold weight (700) - This is how bold text will look</p>
          <p className="font-black">Black weight (900) - This is how black text will look</p>
          <p className="italic">Italic style (400) - This is how italic text will look</p>
          <p className="font-bold italic">Bold Italic (700) - This is how bold italic text will look</p>
        </div>
      </div> */}
      {/* Navigation buttons */}
      {/* <div className="flex justify-center gap-6">
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
  );
}
