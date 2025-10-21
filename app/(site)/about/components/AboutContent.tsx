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
            <div className="lg:space-y-2 lg:w-96 lg:flex-shrink-0 lg:self-start">
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
            description: 'Capture and Invite',
            content: "I'm Ming Jyun Hung, a creative technologist and technical artist.\n\nI create digital experiences that connect technology, design, and emotion — capturing attention as the first step toward interaction and memory.\n\nMy work explores how movement, form, and interaction draw people in, turning awareness into curiosity."
        },
        {
            title: 'Resonance',
            description: 'Engage and Connect',
            content: "When attention becomes engagement, it creates resonance — interaction that flows both ways.\n\nI design systems that respond to people in real time, using rendering, shaders, and procedural design to build environments that feel alive and human.\n\nEach project becomes a dialogue between creative intent and audience response, developed with designers, engineers, and artists through close collaboration."
        },
        {
            title: 'Memory',
            description: 'Sustain and Remember',
            content: "When resonance endures, it forms memory — the emotional echo of an experience. I've created large-scale installations and interactive web works for exhibitions, brands, and platforms across Japan and Taiwan, exploring how digital interaction can leave a lasting impression.\n\nI'm always open to collaborating with teams who share a passion for creating meaningful interactive work — bringing new ideas to life together."
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
