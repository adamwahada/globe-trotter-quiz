import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GameRuleCardProps {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const GameRuleCard: React.FC<GameRuleCardProps> = ({
  step,
  title,
  description,
  icon: Icon,
}) => {
  const stepEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  
  return (
    <div className="group relative flex-shrink-0 w-72 sm:w-80">
      {/* Card with glassmorphism and neon glow */}
      <div className="relative h-full bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-primary/30 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-primary/30 hover:border-primary/60">
        {/* Neon glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Step number */}
        <div className="relative flex items-center gap-3 mb-4">
          <span className="text-3xl">{stepEmojis[step - 1] || step}</span>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
        </div>
        
        {/* Icon */}
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/40 shadow-lg shadow-primary/20">
            <Icon className="h-7 w-7 text-primary" />
          </div>
        </div>
        
        {/* Title */}
        <h3 className="relative text-xl font-display text-foreground mb-2 tracking-wide">
          {title}
        </h3>
        
        {/* Description */}
        <p className="relative text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-primary via-primary/60 to-transparent opacity-60" />
      </div>
    </div>
  );
};
