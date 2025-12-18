import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  duration: number; // minutes
  status: 'waiting' | 'playing' | 'finished';
  currentTurn: number;
  currentCountry: string | null;
  startTime: number | null;
  waitingRoomStartTime: number; // shared timer start
}

interface GameContextType {
  session: GameSession | null;
  currentPlayer: Player | null;
  createSession: (maxPlayers: number, duration: number) => string;
  joinSession: (code: string) => boolean;
  leaveSession: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  rollDice: () => string;
  submitGuess: (guess: string) => { correct: boolean; points: number };
  skipTurn: () => void;
  useHint: () => string;
  endGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Generate random 6-character code
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  const createSession = (maxPlayers: number, duration: number) => {
    const code = generateCode();
    const player: Player = {
      id: '1',
      username: 'You',
      avatar: '🌍',
      color: '#E50914',
      score: 0,
      countriesGuessed: [],
      isReady: false,
    };
    
    setCurrentPlayer(player);
    setSession({
      id: Date.now().toString(),
      code,
      host: player.id,
      players: [player],
      maxPlayers,
      duration,
      status: 'waiting',
      currentTurn: 0,
      currentCountry: null,
      startTime: null,
      waitingRoomStartTime: Date.now(),
    });
    
    return code;
  };

  const joinSession = (code: string, sessionMaxPlayers: number = 2, sessionDuration: number = 30, sessionWaitingStartTime: number = Date.now()) => {
    // Placeholder: validate code
    if (code.length !== 6) return false;
    
    const player: Player = {
      id: Date.now().toString(),
      username: 'Player',
      avatar: '🗺️',
      color: '#4169E1',
      score: 0,
      countriesGuessed: [],
      isReady: false,
    };
    
    setCurrentPlayer(player);
    setSession({
      id: Date.now().toString(),
      code,
      host: 'host',
      players: [
        { id: 'host', username: 'Host', avatar: '🌍', color: '#E50914', score: 0, countriesGuessed: [], isReady: true },
        player,
      ],
      maxPlayers: sessionMaxPlayers, // Use the session's actual maxPlayers
      duration: sessionDuration,
      status: 'waiting',
      currentTurn: 0,
      currentCountry: null,
      startTime: null,
      waitingRoomStartTime: sessionWaitingStartTime, // Use shared timer
    });
    
    return true;
  };

  const leaveSession = () => {
    setSession(null);
    setCurrentPlayer(null);
  };

  const setReady = (ready: boolean) => {
    if (session && currentPlayer) {
      setCurrentPlayer({ ...currentPlayer, isReady: ready });
      setSession({
        ...session,
        players: session.players.map(p => 
          p.id === currentPlayer.id ? { ...p, isReady: ready } : p
        ),
      });
    }
  };

  const startGame = () => {
    if (session) {
      setSession({
        ...session,
        status: 'playing',
        startTime: Date.now(),
      });
    }
  };

  const rollDice = () => {
    // Placeholder: return random country
    const countries = ['France', 'Brazil', 'Japan', 'Australia', 'Egypt', 'Canada', 'India', 'Germany'];
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    if (session) {
      setSession({
        ...session,
        currentCountry: country,
      });
    }
    
    return country;
  };

  const submitGuess = (guess: string) => {
    // Placeholder scoring logic
    const correct = session?.currentCountry?.toLowerCase() === guess.toLowerCase();
    const points = correct ? 3 : 0;
    
    if (session && currentPlayer) {
      const updatedPlayer = {
        ...currentPlayer,
        score: currentPlayer.score + points,
        countriesGuessed: correct 
          ? [...currentPlayer.countriesGuessed, session.currentCountry!]
          : currentPlayer.countriesGuessed,
      };
      
      setCurrentPlayer(updatedPlayer);
      setSession({
        ...session,
        players: session.players.map(p => 
          p.id === currentPlayer.id ? updatedPlayer : p
        ),
        currentTurn: (session.currentTurn + 1) % session.players.length,
        currentCountry: null,
      });
    }
    
    return { correct, points };
  };

  const skipTurn = () => {
    if (session) {
      setSession({
        ...session,
        currentTurn: (session.currentTurn + 1) % session.players.length,
        currentCountry: null,
      });
    }
  };

  const useHint = () => {
    // Return first letter of country
    if (session?.currentCountry) {
      if (currentPlayer) {
        setCurrentPlayer({
          ...currentPlayer,
          score: Math.max(0, currentPlayer.score - 1),
        });
      }
      return session.currentCountry[0];
    }
    return '';
  };

  const endGame = () => {
    if (session) {
      setSession({
        ...session,
        status: 'finished',
      });
    }
  };

  return (
    <GameContext.Provider value={{
      session,
      currentPlayer,
      createSession,
      joinSession,
      leaveSession,
      setReady,
      startGame,
      rollDice,
      submitGuess,
      skipTurn,
      useHint,
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
