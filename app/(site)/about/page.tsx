import ContentOverlay from '@/components/layout/ContentOverlay';

const ABOUT_CONTENT = [
  "I'm Ming Jyun Hung, a creative technologist and technical artist specializing in real-time graphics, interactivity, and immersive environments.",
  "With a background bridging electrical engineering and visual design, I build experiences that connect art and technology — moments that capture attention, move emotion, and remain in memory.",
  "Over the past years, I've created interactive installations and WebGL-based experiences for exhibitions, brands, and digital platforms across Japan and Taiwan.",
  "My work spans physical projection systems, sensory installations, and high-performance web experiences — all designed to respond, evolve, and breathe with the viewer.",
  "Before focusing on independent projects, I led teams and collaborated with studios such as teamLab, Bito Studio, and Tyffon, contributing to large-scale interactive art and real-time systems.",
  "Each collaboration deepened my pursuit of merging precision engineering with artistic expression.",
  "My approach combines GPU-based computation, shader design, and responsive environments to transform technology into presence — not as spectacle, but as dialogue.",
  "Every project is crafted to be seen, felt, and remembered.",
  "Open to collaborations in art, design, architecture, and digital culture, I continue to explore how technology can shape human perception and emotion through living interaction."
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <ContentOverlay>
        {/* <h1 className="text-3xl font-bold mb-6">About Me</h1> */}
        <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          {ABOUT_CONTENT.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </ContentOverlay>
    </div>
  );
}
  