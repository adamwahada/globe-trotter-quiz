import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import worldQuizLogo from '@/assets/world-quiz-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  return (
    <Link 
      to="/" 
      onClick={handleClick}
      className="flex items-center group transition-all duration-300 hover:scale-105"
    >
      <div className="relative">
        <img 
          src={worldQuizLogo} 
          alt="World Quiz" 
          className={`${sizeClasses[size]} w-auto object-contain drop-shadow-[0_0_15px_hsl(var(--primary)/0.6)] transition-all duration-300 group-hover:drop-shadow-[0_0_25px_hsl(var(--primary)/0.8)]`}
        />
        {/* Glow pulse effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
      </div>
    </Link>
  );
};
