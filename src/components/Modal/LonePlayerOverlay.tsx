import React from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface LonePlayerOverlayProps {
    onQuit: () => void;
    onWait?: () => void;
}

export const LonePlayerOverlay: React.FC<LonePlayerOverlayProps> = ({ onQuit, onWait }) => {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl animate-fade-in" />
            <div className="relative bg-card border-2 border-primary/20 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-display text-foreground mb-2">{t('lonePlayerTitle')}</h2>
                <p className="text-muted-foreground mb-8">
                    {t('lonePlayerDesc')}
                </p>
                <div className="flex flex-col gap-3">
                    <Button
                        variant="hero"
                        onClick={onWait}
                        className="w-full"
                    >
                        {t('waitForOthers')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onQuit}
                        className="w-full"
                    >
                        {t('quitGame')}
                    </Button>
                </div>
            </div>
        </div>
    );
};
