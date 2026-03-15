import React, { useState, useEffect } from 'react';
import { X, Heart, Gamepad2, Sparkles, Users, Linkedin, Github, Zap, HelpCircle } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

const LINKEDIN_URL = 'https://www.linkedin.com/in/adam-wahada-1828aa266/';
const GITHUB_URL = 'https://github.com/adamwahada';

interface ProjectStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectStoryModal: React.FC<ProjectStoryModalProps> = ({ isOpen, onClose }) => {
  const [animateIn, setAnimateIn] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
      setActiveSection(0);
      const interval = setInterval(() => {
        setActiveSection(prev => (prev < 4 ? prev + 1 : prev));
      }, 400);
      return () => clearInterval(interval);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const sections = [
    { icon: Heart, title: 'The Beginning', text: 'My interest in geography and maps started at a young age. What began as a small idea eventually grew into a full application that I designed and built from scratch.' },
    { icon: Gamepad2, title: 'The Vision', text: 'The app lets players challenge friends in quizzes, combining learning with social interaction in a fun way.' },
    { icon: HelpCircle, title: 'Need Help?', text: 'All game rules and modes are explained in the "How to Play" section. If you have more questions, feel free to reach out to the admin—I\'m happy to help!' },
    { icon: Sparkles, title: "What's Next", text: "I plan to add new game modes in the future, inspired by user suggestions. Feedback and collaboration are always welcome." },
    { icon: Users, title: 'Connect', text: null },
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${animateIn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleBackdropClick}
    >
      {/* Animated backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Modal content */}
      <div
        className={`relative w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl transition-all duration-700 custom-scrollbar ${
          animateIn ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'
        }`}
        style={{
          background: 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--background)) 50%, hsl(var(--card)) 100%)',
          border: '1px solid hsl(var(--primary) / 0.2)',
          boxShadow: '0 0 80px -20px hsl(var(--primary) / 0.3), inset 0 1px 0 hsl(var(--primary) / 0.1)',
        }}
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full border border-border/50 bg-card/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 hover:rotate-90"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary tracking-widest uppercase">
              <Zap className="h-3 w-3" />
              Behind the Scenes
            </div>
            <h2 className="text-3xl md:text-4xl font-display text-foreground tracking-wider">
              Project Story
            </h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto" />
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section, i) => {
              const Icon = section.icon;
              const isVisible = i <= activeSection;

              if (section.title === 'Connect') {
                return (
                  <div
                    key={i}
                    className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-lg font-display text-foreground tracking-wide">{section.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">Interested in my work? Let's connect.</p>
                      <div className="flex justify-center gap-4">
                        <GameTooltip content="Contact me on: LinkedIn" position="bottom">
                          <a
                            href={LINKEDIN_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-12 h-12 rounded-full border border-border bg-card/60 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                          >
                            <Linkedin className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
                          </a>
                        </GameTooltip>
                        <GameTooltip content="Contact me on: GitHub" position="bottom">
                          <a
                            href={GITHUB_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-12 h-12 rounded-full border border-border bg-card/60 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                          >
                            <Github className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
                          </a>
                        </GameTooltip>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="rounded-xl border border-border/50 bg-card/30 p-5 flex gap-4 items-start hover:border-primary/20 transition-colors duration-300">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-display text-foreground tracking-wide mb-1">{section.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
    </div>
  );
};
