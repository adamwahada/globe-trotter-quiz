import React, { useState, useEffect } from 'react';
import { Lion, Fox, Bear, Penguin, Cat, Rabbit, Panda, Wolf, Owl, Deer, Frog, Dog } from './AvatarComponents';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

interface AvatarDef {
  id: string;
  name: string;
  Component: React.FC<{ color: string }>;
}

const AVATARS: AvatarDef[] = [
  { id: 'lion',    name: 'Lion',    Component: Lion },
  { id: 'fox',     name: 'Fox',     Component: Fox },
  { id: 'bear',    name: 'Bear',    Component: Bear },
  { id: 'penguin', name: 'Penguin', Component: Penguin },
  { id: 'cat',     name: 'Cat',     Component: Cat },
  { id: 'rabbit',  name: 'Rabbit',  Component: Rabbit },
  { id: 'panda',   name: 'Panda',   Component: Panda },
  { id: 'wolf',    name: 'Wolf',    Component: Wolf },
  { id: 'owl',     name: 'Owl',     Component: Owl },
  { id: 'deer',    name: 'Deer',    Component: Deer },
  { id: 'frog',    name: 'Frog',    Component: Frog },
  { id: 'dog',     name: 'Dog',     Component: Dog },
];

const COLORS = [
  { id: 'fire',    value: '#E85D04', label: 'Fire' },
  { id: 'ocean',   value: '#0077B6', label: 'Ocean' },
  { id: 'forest',  value: '#2D6A4F', label: 'Forest' },
  { id: 'sunset',  value: '#C77DFF', label: 'Sunset' },
  { id: 'rose',    value: '#E63946', label: 'Rose' },
  { id: 'gold',    value: '#F4A261', label: 'Gold' },
  { id: 'mint',    value: '#52B788', label: 'Mint' },
  { id: 'sky',     value: '#48CAE4', label: 'Sky' },
  { id: 'berry',   value: '#9B2335', label: 'Berry' },
  { id: 'slate',   value: '#577590', label: 'Slate' },
];

// ─────────────────────────────────────────────
// Props interface (for integration)
// ─────────────────────────────────────────────

export interface AvatarSelectorProps {
  isOpen?: boolean;
  selectedAvatar?: string;
  selectedColor?: string;
  onAvatarChange?: (avatar: string) => void;
  onColorChange?: (color: string) => void;
  onConfirm?: (avatar: string, color: string) => void;
  onOpenChange?: (open: boolean) => void;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen: externalIsOpen = true,
  selectedAvatar: extAvatar,
  selectedColor: extColor,
  onAvatarChange,
  onColorChange,
  onConfirm,
  onOpenChange,
}) => {
  const [internalAvatar, setInternalAvatar] = useState(AVATARS[0].id);
  const [internalColor, setInternalColor] = useState(COLORS[0].value);
  const [isOpen, setIsOpen] = useState(externalIsOpen);

  // Sync external isOpen prop with internal state
  useEffect(() => {
    setIsOpen(externalIsOpen);
  }, [externalIsOpen]);

  const selectedAvatarId = extAvatar ?? internalAvatar;
  const selectedColorValue = extColor ?? internalColor;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  const handleAvatarChange = (id: string) => {
    if (!extAvatar) setInternalAvatar(id);
    onAvatarChange?.(id);
  };

  const handleColorChange = (value: string) => {
    if (!extColor) setInternalColor(value);
    onColorChange?.(value);
  };

  const handleConfirm = () => {
    onConfirm?.(selectedAvatarId, selectedColorValue);
    handleOpenChange(false);
  };

  const currentAvatar = AVATARS.find(a => a.id === selectedAvatarId) ?? AVATARS[0];
  const AvatarComp = currentAvatar.Component;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => handleOpenChange(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-0">
          <h2 className="text-3xl font-display text-foreground text-center mb-2">
            Choose Your Avatar
          </h2>
          <p className="text-muted-foreground text-center text-sm">
            Pick a character and color to represent you
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 bg-secondary/30 border border-border rounded-lg">
            <div
              className="w-20 h-20 rounded-full bg-secondary border-4 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors duration-300"
              style={{ borderColor: selectedColorValue }}
            >
              <AvatarComp color={selectedColorValue} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {currentAvatar.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">
                Your selection above
              </p>
            </div>
          </div>

          {/* Character Selection */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Character
            </p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(avatar => {
                const isSelected = avatar.id === selectedAvatarId;
                const Comp = avatar.Component;
                return (
                  <button
                    key={avatar.id}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center p-2 transition-all duration-150 ${
                      isSelected
                        ? 'bg-secondary/70 scale-110 -translate-y-0.5'
                        : 'bg-secondary hover:bg-secondary/80 hover:scale-105 hover:-translate-y-1'
                    }`}
                    onClick={() => handleAvatarChange(avatar.id)}
                    title={avatar.name}
                    style={{
                      borderColor: isSelected ? selectedColorValue : 'transparent',
                      boxShadow: isSelected ? `0 0 0 2px ${selectedColorValue}40` : 'none',
                    }}
                  >
                    <Comp color={isSelected ? selectedColorValue : 'hsl(var(--muted-foreground))'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Color
            </p>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map(c => {
                const isSelected = c.value === selectedColorValue;
                return (
                  <button
                    key={c.id}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-150 ${
                      isSelected ? 'scale-125' : 'hover:scale-110'
                    }`}
                    onClick={() => handleColorChange(c.value)}
                    title={c.label}
                    style={{
                      backgroundColor: c.value,
                      borderColor: isSelected ? 'white' : 'transparent',
                      boxShadow: isSelected ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px white` : 'none',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={() => handleOpenChange(false)}
            className="flex-1 px-4 py-3 border border-border rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 rounded-lg text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${selectedColorValue}cc, ${selectedColorValue})`,
              boxShadow: `0 4px 20px ${selectedColorValue}55, 0 0 0 1px rgba(255,255,255,0.1)`,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export { AvatarSelector };
