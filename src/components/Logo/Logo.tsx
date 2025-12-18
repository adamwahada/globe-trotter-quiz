import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const { t } = useLanguage();
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <Link 
      to="/" 
      className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105"
    >
      <div className="relative">
        <Globe className={`${sizeClasses[size]} text-primary transition-transform duration-500 group-hover:rotate-180`} />
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      {showText && (
        <span className={`font-display ${textClasses[size]} text-foreground tracking-wider`}>
          {t('logo')}
        </span>
      )}
    </Link>
  );
};
