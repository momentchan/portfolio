/**
 * AboutContent - Main content sections for the about page
 * Separated for better organization and maintainability
 */




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
    const aboutContent = "I'm Ming Jyun Hung, a creative technologist and technical artist specializing in interactive installations and web-based experiences. I create digital work that blends real-time technology with design to shape how people perceive and engage with a space or interface.\n\nI approach interaction as something that should feel alive — systems that respond, evolve, and create a shared sense of presence between the audience and the work.\n\nI've collaborated with exhibitions, brands, and digital platforms across Japan and Taiwan, working closely with designers and engineers to turn ambitious ideas into polished, real-time experiences.\n\nIf you're exploring interactive storytelling or human-centered digital environments, I'd be excited to help bring it to life.";


    const socialLinks = [
        { href: 'https://github.com/momentchan', label: 'GitHub' },
        { href: 'mailto:mingjyunhung@gmail.com', label: 'Mail', isEmail: true },
        { href: 'https://linkedin.com/in/mingjyunhung', label: 'LinkedIn' },
        { href: 'https://instagram.com/mingjyunhung', label: 'Instagram' },
        { href: 'https://x.com/mingjyunhung', label: 'X' },
    ];

    const paragraphs = aboutContent.split('\n\n').filter(p => p.trim());

    return (
        <div className="relative w-full flex-1 flex flex-col justify-center text-white leading-relaxed text-sm sm:text-base sm:max-w-[600px] sm:px-6 sm:mx-auto lg:pointer-events-none pb-20 sm:pb-16 sm:pb-8">
            {/* Main content */}
            <div
                className="animate-crop-down"
                style={{
                    animationDelay: '0ms',
                    opacity: 0,
                    animationFillMode: 'forwards',
                }}
            >
                <div className="space-y-4 sm:space-y-6">
                    {paragraphs.map((paragraph, index) => (
                        <p key={index}>
                            {paragraph}
                        </p>
                    ))}
                </div>
            </div>

            {/* Social Links */}
            <div
                className="flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-6 mt-10 sm:mt-20 border-t border-white/20 sm:justify-center text-xs sm:text-sm lg:text-base pointer-events-auto animate-crop-down"
                style={{
                    animationDelay: '150ms',
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
