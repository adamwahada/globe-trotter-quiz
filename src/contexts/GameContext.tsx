import React, { createContext, useContext, ReactNode } from 'react';
import { useFirebaseSession } from '@/hooks/useFirebaseSession';
import type { GameSession, Player, PlayerData, PlayersMap, TurnState } from '@/types/game';

// Re-export types for backward compatibility
export type { GameSession, Player, PlayerData, PlayersMap, TurnState };

interface GameContextType {
  session: GameSession | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSession: boolean;
  createSession: (maxPlayers: number, duration: number, isSoloMode?: boolean) => Promise<string>;
  joinSession: (code: string, username?: string) => Promise<boolean>;
  leaveSession: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  updatePlayerMetadata: (metadata: Partial<PlayerData>) => Promise<void>;
  startCountdown: () => Promise<void>;
  startGame: () => Promise<void>;
  updateGameState: (updates: {
    currentTurn?: number;
    currentTurnState?: TurnState | null;
    players?: PlayersMap;
    guessedCountries?: string[];
    turnStartTime?: number | null;
    isExtraTime?: boolean;
  }) => Promise<void>;
  updateTurnState: (turnState: TurnState | null) => Promise<void>;
  endGame: () => Promise<void>;
  resumeSession: () => Promise<boolean>;
  checkActiveSession: () => Promise<boolean>;
  getPlayersArray: () => Player[];
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
    updatePlayerMetadata,
    startCountdown,
    startGame,
    updateCurrentGameState,
    updateTurnState,
    endGame,
    resumeSession,
    checkActiveSession,
    getPlayersArray,
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
      updatePlayerMetadata,
      startCountdown,
      startGame,
      updateGameState: updateCurrentGameState,
      updateTurnState,
      endGame,
      resumeSession,
      checkActiveSession,
      getPlayersArray,
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
