import ContentOverlay from '@/components/layout/ContentOverlay';

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <ContentOverlay>
        <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed select-none">
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
      </ContentOverlay>
    </div>
  );
}
