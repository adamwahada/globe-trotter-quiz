import React, { createContext, useContext, ReactNode } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';

export interface Player {
  id: string;
  username: string;
  avatar: string;
  color: string;
  score: number;
  countriesGuessed: string[];
  isReady: boolean;
}

export interface GameSession {
  id: string;
  code: string;
  host: string;
  players: Player[];
  maxPlayers: number;
  duration: number;
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: number;
  currentCountry: string | null;
  startTime: number | null;
  waitingRoomStartTime: number;
  guessedCountries?: string[];
}

interface GameContextType {
  session: GameSession | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  createSession: (maxPlayers: number, duration: number) => Promise<string>;
  joinSession: (code: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  updateGameState: (updates: {
    currentTurn?: number;
    currentCountry?: string | null;
    players?: Player[];
    guessedCountries?: string[];
  }) => Promise<void>;
  endGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    session,
    currentPlayer,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    setReady,
    startGame,
    updateCurrentGameState,
    endGame,
  } = useFirebaseSession();

  return (
    <GameContext.Provider value={{
      session,
      currentPlayer,
      isLoading,
      error,
      createSession,
      joinSession,
      leaveSession,
      setReady,
      startGame,
      updateGameState: updateCurrentGameState,
      endGame,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
