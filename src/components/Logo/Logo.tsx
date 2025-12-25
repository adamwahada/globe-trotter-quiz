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
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-24',
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
      className="flex items-center transition-transform duration-300 hover:scale-105"
    >
      <img 
        src={worldQuizLogo} 
        alt="World Quiz" 
        className={`${sizeClasses[size]} w-auto object-contain drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:drop-shadow-[0_0_25px_rgba(220,38,38,0.7)] transition-all duration-300`}
      />
    </Link>
  );
};
