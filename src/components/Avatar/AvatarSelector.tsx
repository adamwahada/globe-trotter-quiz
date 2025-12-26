import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const avatars = ['🦁', '🐯', '🐘', '🦒', '🦊', '🐨', '🐼', '🦓', '🦄', '🐲', '🐙', '🐢', '🐧', '🦉', '🦋', '🐝', '🦖', '🦈'];
const colors = ['#E50914', '#1DB954', '#4169E1', '#FF6B35', '#9B59B6', '#00CED1', '#FFD700', '#FF1493', '#A0522D', '#2F4F4F'];

interface AvatarSelectorProps {
  selectedAvatar: string;
  selectedColor: string;
  onAvatarChange: (avatar: string) => void;
  onColorChange: (color: string) => void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  selectedColor,
  onAvatarChange,
  onColorChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      {/* Avatar Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('selectAvatar')}
        </label>
        <div className="grid grid-cols-6 gap-2">
          {avatars.map((avatar) => (
            <button
              key={avatar}
              onClick={() => onAvatarChange(avatar)}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                transition-all duration-200
                ${selectedAvatar === avatar
                  ? 'bg-primary/20 ring-2 ring-primary scale-110'
                  : 'bg-secondary hover:bg-secondary/80'}
              `}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          {t('selectColor')}
        </label>
        <div className="flex gap-2 flex-wrap">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`
                w-10 h-10 rounded-full transition-all duration-200
                ${selectedColor === color
                  ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                  : 'hover:scale-105'}
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
          style={{ backgroundColor: selectedColor }}
        >
          {selectedAvatar}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Preview</p>
          <p className="font-medium text-foreground">Your Avatar</p>
        </div>
      </div>
    </div>
  );
};
