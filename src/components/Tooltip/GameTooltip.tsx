import React, { useState, ReactNode } from 'react';

interface GameTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const GameTooltip: React.FC<GameTooltipProps> = ({ 
  content, 
  children, 
  position = 'top' 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 text-sm font-medium rounded-lg
            bg-popover text-popover-foreground border border-border
            shadow-lg whitespace-nowrap tooltip-fade-in
            ${getPositionStyles()}
          `}
        >
          {content}
          {/* Arrow */}
          <div 
            className={`
              absolute w-2 h-2 bg-popover border-border rotate-45
              ${position === 'top' ? 'top-full -translate-y-1/2 left-1/2 -translate-x-1/2 border-r border-b' : ''}
              ${position === 'bottom' ? 'bottom-full translate-y-1/2 left-1/2 -translate-x-1/2 border-l border-t' : ''}
              ${position === 'left' ? 'left-full -translate-x-1/2 top-1/2 -translate-y-1/2 border-t border-r' : ''}
              ${position === 'right' ? 'right-full translate-x-1/2 top-1/2 -translate-y-1/2 border-b border-l' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};
