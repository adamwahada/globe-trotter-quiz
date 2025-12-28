import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/Logo/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { SoundToggle } from '@/components/Sound/SoundToggle';
import { AuthModal } from '@/components/Auth/AuthModal';
import { UserMenu } from '@/components/Auth/UserMenu';
import { Button } from '@/components/ui/button';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  variant?: 'default' | 'game';
  rightContent?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'default', rightContent }) => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5 py-2' 
            : 'bg-transparent py-4'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          <Logo size={scrolled ? 'sm' : 'md'} />
          
          <div className="flex items-center gap-4">
            <SoundToggle />
            <LanguageSwitcher />
            
            {rightContent ? (
              rightContent
            ) : isAuthenticated ? (
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
                    className="text-foreground/80 hover:text-foreground"
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
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20 md:h-24" />

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};
