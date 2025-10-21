/**
 * AboutContent - Main content sections for the about page
 * Separated for better organization and maintainability
 */



interface PairedContentProps {
    title: string;
    description: string;
    content: string;
}

function PairedContentSection({ title, description, content }: PairedContentProps) {
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    return (
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-16">
            {/* Left side - Title and short description */}
            <div className="lg:space-y-1 lg:w-96 lg:flex-shrink-0 lg:self-start">
                <h3 className="text-xl lg:text-4xl font-semibold text-white">{title}</h3>
                <p className="text-sm lg:text-base text-white/70 whitespace-nowrap">{description}</p>
            </div>

            {/* Right side - Detailed content */}
            <div className="space-y-1 lg:flex-1 lg:self-start">
                {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm lg:text-base text-white leading-normal lg:leading-relaxed">
                        {paragraph}
                    </p>
                ))}
            </div>
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
            className="text-white hover:text-white/70 transition-colors"
        >
            {children}
        </a>
    );
}

export default function AboutContent() {
    const pairedContent = [
        {
            title: 'Attention',
            description: 'Capture the eye. Trigger curiosity.',
            content: "I'm Ming Jyun Hung, a creative technologist and technical artist exploring how interactive technology can move people — creating experiences that demand attention, evoke emotion, and endure in memory.\n\nI design with vivid visual detail to capture the eye and spark curiosity."
        },
        {
            title: 'Resonance',
            description: 'Respond and evolve with the audience.',
            content: "My work doesn't stop at visuals — it responds, transforms, and connects.\n\nUsing real-time rendering, shader programming, and procedural systems, I craft experiences that follow a living rhythm: attention through detail, resonance through responsiveness.\n\nInteraction, to me, is a conversation between system and audience, not just input and output."
        },
        {
            title: 'Memory',
            description: 'Transform into something personal and unforgettable.',
            content: "I create large-scale interactive installations and web experiences for exhibitions, brands, and digital platforms across Japan and Taiwan — works that don’t just impress in the moment, but stay with people long after.\n\nEach project advances my pursuit of uniting art, technology, and emotion into seamless, living systems. I collaborate with teams who want to push interactive experiences further — through exhibitions, digital products, or experimental concepts that haven’t been done before."
        }
    ];


    const socialLinks = [
        { href: 'https://instagram.com/mingjyunhung', label: 'Instagram' },
        { href: 'https://linkedin.com/in/mingjyunhung', label: 'LinkedIn' },
        { href: 'https://github.com/momentchan', label: 'GitHub' },
        { href: 'mailto:mingjyunhung@gmail.com', label: 'Mail', isEmail: true }
    ];

    return (
        <div className="relative w-full lg:pt-32 lg:max-w-6xl lg:mx-auto text-white leading-relaxed select-none text-sm sm:text-base lg:pointer-events-none">
            {/* Main content layout - paired sections */}
            <div className="space-y-8 lg:space-y-12">
                {pairedContent.map((section, index) => (
                    <div
                        key={index}
                        className="animate-crop-down"
                        style={{
                            animationDelay: `${index * 150}ms`,
                            opacity: 0,
                            animationFillMode: 'forwards',
                        }}
                    >
                        <PairedContentSection
                            title={section.title}
                            description={section.description}
                            content={section.content}
                        />
                    </div>
                ))}
            </div>

            {/* Social Links */}
            <div
                className="flex flex-wrap gap-4 sm:gap-6 pt-2 lg:pt-6 my-6 lg:my-20 border-t border-white/20 lg:justify-center text-xs sm:text-sm lg:text-base pointer-events-auto animate-crop-down"
                style={{
                    animationDelay: `${pairedContent.length * 150}ms`,
                    opacity: 0,
                    animationFillMode: 'forwards',
                }}
            >
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
