import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { DailyRollModal } from './DailyRollModal';

const ROLL_STORAGE_KEY = 'worldquiz_daily_roll';

const getTimeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
};

const hasRolledToday = (userId: string): boolean => {
  try {
    const stored = localStorage.getItem(ROLL_STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored);
    if (data.userId !== userId) return false;
    // Check if the stored date is today
    const storedDate = new Date(data.date).toDateString();
    const today = new Date().toDateString();
    return storedDate === today;
  } catch {
    return false;
  }
};

const markRolledToday = (userId: string) => {
  localStorage.setItem(ROLL_STORAGE_KEY, JSON.stringify({
    userId,
    date: new Date().toISOString(),
  }));
};

export const DailyRollButton: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [alreadyRolled, setAlreadyRolled] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setAlreadyRolled(hasRolledToday(user.id));

    // Set a timer to reset at midnight
    const ms = getTimeUntilMidnight();
    const timer = setTimeout(() => {
      setAlreadyRolled(false);
    }, ms);
    return () => clearTimeout(timer);
  }, [user?.id]);

  if (!isAuthenticated) return null;

  const handleRollComplete = (_prizeIndex: number) => {
    if (user?.id) {
      markRolledToday(user.id);
      setAlreadyRolled(true);
    }
  };

  return (
    <>
      <GameTooltip content={t('dailyRollTooltip')} position="bottom">
        <button
          onClick={() => setModalOpen(true)}
          className="relative p-2 rounded-lg bg-secondary/80 border border-border hover:border-primary hover:bg-primary/10 transition-all duration-300 group"
        >
          <Gift className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />

          {/* Notification dot when not rolled yet */}
          {!alreadyRolled && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse border-2 border-background" />
          )}
        </button>
      </GameTooltip>

      <DailyRollModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        alreadyRolled={alreadyRolled}
        onRollComplete={handleRollComplete}
      />
    </>
  );
};
