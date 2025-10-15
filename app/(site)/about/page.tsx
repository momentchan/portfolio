import ContentOverlay from '@/app/(site)/about/ContentOverlay';

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <ContentOverlay>
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed select-none">
          <div className="space-y-4">
            <p>
              I'm Ming Jyun Hung, a creative technologist and technical artist exploring how technology can move people — creating experiences that capture attention, evoke emotion, and stay in memory.
            </p>

            <p>
              Through advanced visual computing and interactive design, I craft works that follow a simple rhythm: they capture attention through vivid visual detail, resonate through responsiveness, and endure in memory through transformation and personal connection. Using real-time rendering, shader programming, and procedural systems, I bring both digital and physical spaces to life — making technology feel not mechanical, but human and alive.
            </p>

            <p>
              I create large-scale interactive installations and web experiences for exhibitions, brands, and digital platforms across Japan and Taiwan. Each project continues my pursuit of uniting art, technology, and emotion into seamless, living systems.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex gap-6 pt-4 border-t border-gray-200 dark:border-gray-700 justify-center">
            <a
              href="https://instagram.com/mingjyunhung"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://linkedin.com/in/mingjyunhung"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/momentchan"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href="mailto:mingjyunhung@gmail.com"
              className="hover:text-black dark:hover:text-white transition-colors"
            >
              Mail
            </a>
          </div>
        </div>
      </ContentOverlay>
    </div>
  );
}
