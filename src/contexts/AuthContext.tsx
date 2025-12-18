import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  color: string;
  stats: {
    totalGames: number;
    wins: number;
    avgScore: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Placeholder avatars
const avatars = ['🌍', '🗺️', '🧭', '✈️', '🚀', '🌎', '🌏', '🏔️'];
const colors = ['#E50914', '#1DB954', '#4169E1', '#FF6B35', '#9B59B6', '#00CED1'];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    // Placeholder: simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: '1',
      email,
      username: email.split('@')[0],
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      stats: {
        totalGames: 12,
        wins: 5,
        avgScore: 24.5,
      },
    });
    setIsLoading(false);
  };

  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    // Placeholder: simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: Date.now().toString(),
      email,
      username,
      avatar: avatars[0],
      color: colors[0],
      stats: {
        totalGames: 0,
        wins: 0,
        avgScore: 0,
      },
    });
    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
