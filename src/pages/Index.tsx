import React, { useState } from 'react';
import { Logo } from '@/components/Logo/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { AuthModal } from '@/components/Auth/AuthModal';
import { UserMenu } from '@/components/Auth/UserMenu';
import { GameSettingsModal } from '@/components/Modal/GameSettingsModal';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { Play, BookOpen, Trophy, Users, Target, Lightbulb, ChevronDown } from 'lucide-react';

const Index = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToastContext();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [gameModalOpen, setGameModalOpen] = useState(false);

  const handleStartGame = () => {
    if (!isAuthenticated) {
      addToast('info', t('authRequired'));
      setAuthMode('signin');
      setAuthModalOpen(true);
    } else {
      setGameModalOpen(true);
    }
  };

  const rules = [
    { icon: Play, text: t('rule1') },
    { icon: Target, text: t('rule2') },
    { icon: Trophy, text: t('rule3') },
    { icon: Lightbulb, text: t('rule4') },
  ];

  const scoring = [
    { points: '3', label: t('pointsCorrect'), color: 'text-success' },
    { points: '2', label: t('pointsClose'), color: 'text-info' },
    { points: '-1', label: t('pointsHint'), color: 'text-warning' },
    { points: '0', label: t('pointsSkip'), color: 'text-muted-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Map Image */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1920&q=80')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <Logo size="md" />
        
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <div className="flex gap-2">
              <GameTooltip content={t('signIn')} position="bottom">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthModalOpen(true);
                  }}
                >
                  {t('signIn')}
                </Button>
              </GameTooltip>
              <GameTooltip content={t('signUp')} position="bottom">
                <Button 
                  variant="netflix"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthModalOpen(true);
                  }}
                >
                  {t('signUp')}
                </Button>
              </GameTooltip>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-foreground mb-4 tracking-wider">
            {t('heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GameTooltip content="Start a new game session" position="bottom">
              <Button 
                variant="hero" 
                size="xl"
                onClick={handleStartGame}
                className="glow-red pulse-glow"
              >
                <Play className="h-6 w-6" />
                {t('startGame')}
              </Button>
            </GameTooltip>
            
            <Button 
              variant="outline" 
              size="xl"
              onClick={() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <BookOpen className="h-5 w-5" />
              {t('howToPlay')}
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-8 w-8 text-muted-foreground" />
        </div>
      </section>

      {/* Rules Section */}
      <section id="rules" className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-12">
            {t('rulesTitle')}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {rules.map((rule, index) => (
              <div 
                key={index}
                className="card-netflix p-6 flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-3 rounded-lg bg-primary/20">
                  <rule.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-foreground leading-relaxed">{rule.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section className="relative z-10 py-20 px-4 bg-secondary/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-12">
            {t('scoringTitle')}
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scoring.map((item, index) => (
              <div 
                key={index}
                className="card-netflix p-6 text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className={`text-5xl font-display mb-2 ${item.color}`}>
                  {item.points}
                </p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">Multiplayer</h3>
              <p className="text-muted-foreground">Challenge 2-4 friends in real-time geography battles</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">Interactive Map</h3>
              <p className="text-muted-foreground">Click, zoom, and explore the world map to find countries</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-foreground">Leaderboard</h3>
              <p className="text-muted-foreground">Track your progress and compete for the top spot</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display text-foreground mb-6">
            Ready to Test Your Knowledge?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of players from around the world in the ultimate geography challenge.
          </p>
          <Button 
            variant="hero" 
            size="xl"
            onClick={handleStartGame}
            className="glow-red"
          >
            <Play className="h-6 w-6" />
            {t('startGame')}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2024 World Quiz. Test your geography knowledge.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
      
      <GameSettingsModal 
        isOpen={gameModalOpen} 
        onClose={() => setGameModalOpen(false)}
      />
    </div>
  );
};

export default Index;
