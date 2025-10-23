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
    const aboutContent = "I'm Ming Jyun Hung, a creative technologist and technical artist who creates digital experiences that connect technology, design, and emotion.\n\nI focus on interactive installations and real-time digital visuals — exploring how motion, perception, and responsiveness can turn interaction into a shared moment worth remembering.\n\nMy work spans exhibitions, brands, and digital platforms across Japan and Taiwan, where I collaborate with designers, engineers, and artists to bring ambitious ideas to life. I enjoy turning concepts into experiences that move people — visually and emotionally.\n\nIf you're working on something that pushes interactive storytelling or human-centered technology, I'd love to talk.";


    const socialLinks = [
        { href: 'https://instagram.com/mingjyunhung', label: 'Instagram' },
        { href: 'https://linkedin.com/in/mingjyunhung', label: 'LinkedIn' },
        { href: 'https://github.com/momentchan', label: 'GitHub' },
        { href: 'mailto:mingjyunhung@gmail.com', label: 'Mail', isEmail: true }
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
