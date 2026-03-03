import React, { useState, useEffect } from 'react';
import { Github, Linkedin, BookHeart } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

const LINKEDIN_URL = 'https://www.linkedin.com/in/adam-wahada-1828aa266/';
const GITHUB_URL = 'https://github.com/adamwahada';

interface FloatingContactIconsProps {
  onProjectStoryClick?: () => void;
}

export const FloatingContactIcons: React.FC<FloatingContactIconsProps> = ({ onProjectStoryClick }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY < 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const iconClass = "group w-12 h-12 rounded-full border border-border bg-card/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]";
  const iconInner = "h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors duration-300";

  return (
    <div
      className={`fixed right-6 bottom-8 z-40 flex flex-col gap-4 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16 pointer-events-none'
      }`}
    >
      <GameTooltip content="Contact me on: LinkedIn" position="left">
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="LinkedIn">
          <Linkedin className={iconInner} />
        </a>
      </GameTooltip>

      <GameTooltip content="Contact me on: GitHub" position="left">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={iconClass} aria-label="GitHub">
          <Github className={iconInner} />
        </a>
      </GameTooltip>

      <GameTooltip content="The story behind this project" position="left">
        <button onClick={onProjectStoryClick} className={iconClass} aria-label="Project Story">
          <BookHeart className={iconInner} />
        </button>
      </GameTooltip>
    </div>
  );
};
