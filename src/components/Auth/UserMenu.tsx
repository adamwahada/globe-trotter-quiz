import React, { useState } from 'react';
import { User, Settings, History, Trophy, LogOut, ChevronDown, Shield, UserPlus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { GameHistoryModal } from '@/components/History/GameHistoryModal';
import { AchievementsModal } from '@/components/History/AchievementsModal';
import { EditProfileModal } from '@/components/Auth/EditProfileModal';
import { AuthModal } from '@/components/Auth/AuthModal';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const UserMenu: React.FC = () => {
  const { t } = useLanguage();
  const { user, signOut, isGuest, guestTimeRemaining } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!user) return null;

  const initials = user.username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Guest users only get sign out + upgrade
  const menuItems = isGuest
    ? []
    : [
        { icon: Settings, label: t('editProfile'), action: () => setShowEditProfile(true) },
        { icon: History, label: t('gameHistory'), action: () => setShowHistoryModal(true) },
        { icon: Trophy, label: t('achievements'), action: () => setShowAchievementsModal(true) },
      ];

  return (
    <div className="relative">
      <GameTooltip content={isGuest ? 'Guest Player' : t('profile')} position="bottom">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: user.color }}
          >
            {initials}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </GameTooltip>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 w-72 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden animate-scale-in">
            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate">{user.username}</p>
                  {isGuest ? (
                    <div className="flex items-center gap-1 text-sm text-warning">
                      <Clock className="h-3 w-3" />
                      <span className="font-display tabular-nums">
                        {guestTimeRemaining !== null ? formatTime(guestTimeRemaining) : '—'} left
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats — only for registered users */}
            {!isGuest && (
              <div className="p-4 border-b border-border">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-display text-primary">{user.stats.totalGames}</p>
                    <p className="text-xs text-muted-foreground">{t('totalGames')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display text-success">
                      {user.stats.totalGames > 0 
                        ? Math.round((user.stats.wins / user.stats.totalGames) * 100) 
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">{t('winRate')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-display text-info">{user.stats.avgScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{t('avgScore')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-foreground"
                >
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}

              {/* Guest: Upgrade to account */}
              {isGuest && (
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-sm font-medium">Create Account</span>
                </button>
              )}
              
              {isAdmin && !isGuest && (
                <>
                  <hr className="my-2 border-border" />
                  <button
                    onClick={() => {
                      navigate('/admin');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
                  >
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">Admin Dashboard</span>
                  </button>
                </>
              )}

              <hr className="my-2 border-border" />
              
              <button
                onClick={() => {
                  signOut();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/20 transition-colors text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm">{t('signOut')}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {!isGuest && (
        <>
          <GameHistoryModal 
            isOpen={showHistoryModal} 
            onClose={() => setShowHistoryModal(false)} 
          />
          <AchievementsModal
            isOpen={showAchievementsModal}
            onClose={() => setShowAchievementsModal(false)}
          />
          <EditProfileModal
            isOpen={showEditProfile}
            onClose={() => setShowEditProfile(false)}
          />
        </>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
      />
    </div>
  );
};