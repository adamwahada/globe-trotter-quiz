import React, { createContext, useContext, ReactNode } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import type { GameSession, Player, TurnState } from '@/types/game';

// Re-export types for backward compatibility
export type { GameSession, Player, TurnState };

interface GameContextType {
  session: GameSession | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSession: boolean;
  createSession: (maxPlayers: number, duration: number) => Promise<string>;
  joinSession: (code: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  startCountdown: () => Promise<void>;
  startGame: () => Promise<void>;
  updateGameState: (updates: {
    currentTurn?: number;
    currentTurnState?: TurnState | null;
    players?: Player[];
    guessedCountries?: string[];
    turnStartTime?: number | null;
  }) => Promise<void>;
  updateTurnState: (turnState: TurnState | null) => Promise<void>;
  endGame: () => Promise<void>;
  resumeSession: () => Promise<boolean>;
  checkActiveSession: () => Promise<boolean>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    session,
    currentPlayer,
    isLoading,
    error,
    hasActiveSession,
    createSession,
    joinSession,
    leaveSession,
    setReady,
    startCountdown,
    startGame,
    updateCurrentGameState,
    updateTurnState,
    endGame,
    resumeSession,
    checkActiveSession,
  } = useFirebaseSession();

  return (
    <GameContext.Provider value={{
      session,
      currentPlayer,
      isLoading,
      error,
      hasActiveSession,
      createSession,
      joinSession,
      leaveSession,
      setReady,
      startCountdown,
      startGame,
      updateGameState: updateCurrentGameState,
      updateTurnState,
      endGame,
      resumeSession,
      checkActiveSession,
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
