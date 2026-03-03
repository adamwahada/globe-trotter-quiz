import React, { useState, useEffect } from 'react';
import { Github, Linkedin } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

const LINKEDIN_URL = 'https://www.linkedin.com/in/adam-wahada-1828aa266/';
const GITHUB_URL = 'https://github.com/adamwahada';

export const FloatingContactIcons: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const atTop = scrollY < 200;
      const atBottom = scrollY + windowH >= docH - 150;
      setVisible(atTop || atBottom);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'
      }`}
    >
      <GameTooltip content="Contact me on: LinkedIn" position="left">
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-12 h-12 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
          aria-label="LinkedIn"
        >
          <Linkedin className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
        </a>
      </GameTooltip>

      <GameTooltip content="Contact me on: GitHub" position="left">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group w-12 h-12 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
          aria-label="GitHub"
        >
          <Github className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
        </a>
      </GameTooltip>
    </div>
  );
};
