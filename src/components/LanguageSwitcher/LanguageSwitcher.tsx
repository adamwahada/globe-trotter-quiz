import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n/translations';
import { Globe } from 'lucide-react';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLang = languages.find(l => l.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center rounded-lg bg-secondary/50 hover:bg-secondary border border-border transition-all duration-300 ${
          compact ? 'gap-1 px-1.5 py-1' : 'gap-2 px-3 py-2'
        }`}
      >
        <Globe className={`text-muted-foreground ${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
        <span className={compact ? 'text-base leading-none' : 'text-lg'}>{currentLang?.flag}</span>
        {!compact && (
          <span className="text-sm text-foreground hidden sm:inline">{currentLang?.label}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-scale-in">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${language === lang.code ? 'bg-primary/20 text-primary' : 'hover:bg-secondary text-foreground'}
                `}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
