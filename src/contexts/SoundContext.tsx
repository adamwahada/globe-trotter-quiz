import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playToastSound: (type?: 'success' | 'error' | 'info' | 'game') => void;
  playDiceSound: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Create audio context lazily to avoid autoplay restrictions
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a simple beep sound
const playBeep = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

// Dice roll sound - series of quick clicks
const playDiceRollSound = () => {
  try {
    const ctx = getAudioContext();
    const numClicks = 6;
    
    for (let i = 0; i < numClicks; i++) {
      const delay = i * 0.08;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 200 + Math.random() * 300;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.05);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + 0.05);
    }
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('soundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const playToastSound = useCallback((type: 'success' | 'error' | 'info' | 'game' = 'info') => {
    if (!soundEnabled) return;
    
    switch (type) {
      case 'success':
        playBeep(880, 0.15, 'sine', 0.2);
        setTimeout(() => playBeep(1100, 0.2, 'sine', 0.2), 100);
        break;
      case 'error':
        playBeep(300, 0.2, 'square', 0.15);
        setTimeout(() => playBeep(250, 0.25, 'square', 0.15), 150);
        break;
      case 'game':
        playBeep(660, 0.1, 'sine', 0.2);
        setTimeout(() => playBeep(880, 0.1, 'sine', 0.2), 80);
        setTimeout(() => playBeep(1100, 0.15, 'sine', 0.2), 160);
        break;
      case 'info':
      default:
        playBeep(600, 0.15, 'sine', 0.2);
        break;
    }
  }, [soundEnabled]);

  const playDiceSound = useCallback(() => {
    if (!soundEnabled) return;
    playDiceRollSound();
  }, [soundEnabled]);

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playToastSound, playDiceSound }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
