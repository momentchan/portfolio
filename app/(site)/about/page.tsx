import Scene from '@/components/scene-about/Scene';

export default function AboutPage() {
  return (
    <>
      <div className="fixed inset-0 w-full h-screen z-0">
        <Scene />
      </div>

      {/* Content - scrollable */}
      <div className="relative z-10 h-screen overflow-y-auto scrollbar-hide lg:pointer-events-none">
        <div className="w-full lg:max-w-6xl lg:mx-auto lg:px-10">
          <div className="pt-6 sm:pt-10 lg:pt-30 pb-20 min-h-full">
            <div className="w-full">
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed select-none text-sm sm:text-base">
                {/* Main content layout - left: ARM, right: intro texts */}
                <div className="flex flex-col lg:flex-row lg:justify-center gap-8 lg:gap-12 items-start">
                  {/* Attention Resonance Memory - Left side */}
                  <div className="space-y-6 lg:w-auto lg:flex-shrink-0">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Attention</h3>
                        <p className="text-sm">Capture the eye. Trigger curiosity.</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Resonance</h3>
                        <p className="text-sm">Respond and evolve with the audience.</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-black dark:text-white">Memory</h3>
                        <p className="text-sm">Transform into something personal and unforgettable.</p>
                      </div>
                    </div>
                  </div>

                  {/* Intro texts - Right side */}
                  <div className="space-y-4 lg:flex-1">
                    <p>
                      I&apos;m Ming Jyun Hung, a creative technologist and technical artist exploring how interactive technology can move people — creating experiences that demand attention, evoke emotion, and live on in memory.
                    </p>

                    <p>
                      My work doesn&apos;t stop at visuals. It responds, transforms, and connects.
                      Through advanced visual computing and interactive design, I build experiences that follow a living rhythm:
                      attention through vivid detail, resonance through responsiveness, and memory through transformation.
                    </p>

                    <p>
                      Using real-time rendering, shader programming, and procedural systems, I bring both digital and physical spaces to life — making technology feel not mechanical, but human and alive. I&apos;m driven by the idea that interaction is not just input and output, but a conversation between system and audience.
                    </p>

                    <p>
                      I&apos;ve created large-scale interactive installations and web experiences for exhibitions, brands, and digital platforms across Japan and Taiwan. Each project deepens my pursuit of uniting art, technology, and emotion into seamless, living systems — works that don&apos;t just impress in the moment, but stay with people long after.
                    </p>

                    <p>
                      I love collaborating with teams and creatives who want to push interactive experiences further — whether through exhibitions, digital products, or experimental concepts that haven&apos;t been done before.
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="flex flex-wrap gap-4 sm:gap-6 py-4 my-8  border-t border-gray-200 dark:border-gray-700 justify-center text-xs sm:text-sm lg:text-base pointer-events-auto">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
