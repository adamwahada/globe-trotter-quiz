import React from 'react';
import { X, MessageSquare, Star, Ban, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PlayerProfileModalProps {
  userId: string;
  userName: string;
  userEmail: string | null;
  onClose: () => void;
  onBan?: (userId: string, userName: string, userEmail: string | null) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  userId, userName, userEmail, onClose, onBan,
}) => {
  const navigate = useNavigate();

  const handleMessages = () => {
    onClose();
    navigate('/admin/messages', { state: { openUserId: userId, openUserName: userName, openUserEmail: userEmail } });
  };

  const handleFeedback = () => {
    onClose();
    navigate('/admin/feedback', { state: { filterUserId: userId, filterUserName: userName } });
  };

  const handleBan = () => {
    onClose();
    onBan?.(userId, userName, userEmail);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{userName}</p>
            {userEmail && <p className="text-xs text-muted-foreground truncate">{userEmail}</p>}
            <p className="text-[10px] text-muted-foreground/50 truncate">{userId}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleMessages}
            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-background hover:bg-secondary/40 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Message History</p>
              <p className="text-xs text-muted-foreground">View conversation with this user</p>
            </div>
          </button>

          <button
            onClick={handleFeedback}
            className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 bg-background hover:bg-secondary/40 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Feedback History</p>
              <p className="text-xs text-muted-foreground">View all feedbacks from this user</p>
            </div>
          </button>

          {onBan && (
            <button
              onClick={handleBan}
              className="flex items-center gap-3 p-3 rounded-xl border border-destructive/30 hover:border-destructive bg-background hover:bg-destructive/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Ban className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Ban User</p>
                <p className="text-xs text-muted-foreground">Issue a temporary or permanent ban</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
