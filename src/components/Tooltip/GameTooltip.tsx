import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isRTL } = useLanguage();

  // For RTL, invert left/right positions
  const effectivePosition = (() => {
    if (!isRTL) return position;
    if (position === 'left') return 'right';
    if (position === 'right') return 'left';
    return position;
  })();

  useEffect(() => {
    if (!isVisible || !triggerRef.current) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;

      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const gap = 8;

      let top = 0;
      let left = 0;

      switch (effectivePosition) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - gap;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + gap;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + gap;
          break;
      }

      // Keep tooltip within viewport bounds
      const padding = 8;
      if (left < padding) left = padding;
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
      }
      if (top < padding) {
        // Flip to bottom if clipped at top
        top = triggerRect.bottom + gap;
      }
      if (top + tooltipRect.height > window.innerHeight - padding) {
        // Flip to top if clipped at bottom
        top = triggerRect.top - tooltipRect.height - gap;
      }

      setCoords({ top, left });
    };

    // Run position calc after render so tooltip dimensions are available
    requestAnimationFrame(updatePosition);
  }, [isVisible, effectivePosition]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] px-3 py-2 text-sm font-medium rounded-lg bg-popover text-popover-foreground border border-border shadow-lg whitespace-nowrap tooltip-fade-in pointer-events-none"
          style={{ top: coords.top, left: coords.left }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
};
