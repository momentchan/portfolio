/**
 * AboutContent - Main content sections for the about page
 * Separated for better organization and maintainability
 */

interface ContentSectionProps {
    title: string;
    description: string;
}

function ContentSection({ title, description }: ContentSectionProps) {
    return (
        <div className="space-y-3">
            <h3 className="text-xl font-semibold text-black dark:text-white">{title}</h3>
            <p className="text-sm">{description}</p>
        </div>
    );
}

interface SocialLinkProps {
    href: string;
    children: React.ReactNode;
    isEmail?: boolean;
}

function SocialLink({ href, children, isEmail = false }: SocialLinkProps) {
    const linkProps = isEmail
        ? { href }
        : { href, target: '_blank', rel: 'noopener noreferrer' };

    return (
        <a
            {...linkProps}
            className="hover:text-black dark:hover:text-white transition-colors"
        >
            {children}
        </a>
    );
}

export default function AboutContent() {
    const contentSections = [
        {
            title: 'Attention',
            description: 'Capture the eye. Trigger curiosity.'
        },
        {
            title: 'Resonance',
            description: 'Respond and evolve with the audience.'
        },
        {
            title: 'Memory',
            description: 'Transform into something personal and unforgettable.'
        }
    ];

    const introParagraphs = [
        "I'm Ming Jyun Hung, a creative technologist and technical artist exploring how interactive technology can move people — creating experiences that demand attention, evoke emotion, and live on in memory.",
        "My work doesn't stop at visuals. It responds, transforms, and connects. Through advanced visual computing and interactive design, I build experiences that follow a living rhythm: attention through vivid detail, resonance through responsiveness, and memory through transformation.",
        "Using real-time rendering, shader programming, and procedural systems, I bring both digital and physical spaces to life — making technology feel not mechanical, but human and alive. I'm driven by the idea that interaction is not just input and output, but a conversation between system and audience.",
        "I've created large-scale interactive installations and web experiences for exhibitions, brands, and digital platforms across Japan and Taiwan. Each project deepens my pursuit of uniting art, technology, and emotion into seamless, living systems — works that don't just impress in the moment, but stay with people long after.",
        "I love collaborating with teams and creatives who want to push interactive experiences further — whether through exhibitions, digital products, or experimental concepts that haven't been done before."
    ];

    const socialLinks = [
        { href: 'https://instagram.com/mingjyunhung', label: 'Instagram' },
        { href: 'https://linkedin.com/in/mingjyunhung', label: 'LinkedIn' },
        { href: 'https://github.com/momentchan', label: 'GitHub' },
        { href: 'mailto:mingjyunhung@gmail.com', label: 'Mail', isEmail: true }
    ];

    return (
        <div className="w-full lg:max-w-6xl lg:mx-auto text-gray-700 dark:text-gray-300 leading-relaxed select-none text-sm sm:text-base py-8" style={{ minHeight: 'calc(100vh + 200px)' }}>
            {/* Main content layout - left: ARM, right: intro texts */}
            <div className="flex flex-col lg:flex-row lg:justify-center gap-8 lg:gap-12 items-start">
                {/* Attention Resonance Memory - Left side */}
                <div className="space-y-6 lg:w-auto lg:flex-shrink-0">
                    <div className="space-y-4">
                        {contentSections.map((section, index) => (
                            <ContentSection
                                key={index}
                                title={section.title}
                                description={section.description}
                            />
                        ))}
                    </div>
                </div>

                {/* Intro texts - Right side */}
                <div className="space-y-4 lg:flex-1">
                    {introParagraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </div>

            {/* Social Links */}
            <div className="flex flex-wrap gap-4 sm:gap-6 py-4 my-8 border-t border-gray-200 dark:border-gray-700 justify-center text-xs sm:text-sm lg:text-base pointer-events-auto">
                {socialLinks.map((link, index) => (
                    <SocialLink
                        key={index}
                        href={link.href}
                        isEmail={link.isEmail}
                    >
                        {link.label}
                    </SocialLink>
                ))}
            </div>
        </div>
    );
}
