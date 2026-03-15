import React from 'react';
import { Navbar } from '@/components/Navbar/Navbar';
import { Github, Linkedin, ArrowLeft, Heart, Sparkles, Users, Gamepad2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useNavigate } from 'react-router-dom';

const LINKEDIN_URL = 'https://www.linkedin.com/in/adam-wahada-1828aa266/';
const GITHUB_URL = 'https://github.com/adamwahada';

const ProjectStory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/world-map-bg.webp)' }} />
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />

      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-display text-foreground mb-4 tracking-wider">
            Project Story
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Story content */}
        <div className="space-y-8">
          <div className="card-netflix p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">The Beginning</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              My interest in geography and maps started at a young age. What began as a small idea eventually grew into a full application that I designed and built from scratch.
            </p>
          </div>

          <div className="card-netflix p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">The Vision</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              The app lets players challenge friends in quizzes, combining learning with social interaction in a fun way.
            </p>
          </div>

          <div className="card-netflix p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">Need Help?</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              All game rules and modes are explained in the "How to Play" section. If you have more questions, feel free to reach out to the admin—I'm happy to help!
            </p>
          </div>

          <div className="card-netflix p-8 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">What's Next</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-lg">
              I plan to add new game modes in the future, inspired by user suggestions. Feedback and collaboration are always welcome—if you're interested in my work or want to share ideas, feel free to reach out.
            </p>
          </div>

          {/* Connect section */}
          <div className="card-netflix p-8 text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-display text-foreground">Connect With Me</h2>
            </div>
            <p className="text-muted-foreground">
              Want to collaborate or share ideas? Find me on:
            </p>
            <div className="flex justify-center gap-6">
              <GameTooltip content="Contact me on: LinkedIn" position="bottom">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-14 h-14 rounded-full border border-border bg-secondary/50 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                >
                  <Linkedin className="h-6 w-6 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
                </a>
              </GameTooltip>
              <GameTooltip content="Contact me on: GitHub" position="bottom">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-14 h-14 rounded-full border border-border bg-secondary/50 flex items-center justify-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:scale-110 hover:shadow-[0_0_20px_hsl(357_92%_47%/0.3)]"
                >
                  <Github className="h-6 w-6 text-foreground/70 group-hover:text-foreground transition-colors duration-300" />
                </a>
              </GameTooltip>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectStory;
