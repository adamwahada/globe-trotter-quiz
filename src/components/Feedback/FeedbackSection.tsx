import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { getFirebaseIdToken } from '@/utils/firebaseToken';

interface FeedbackSectionProps {
  onLoginRequest: () => void;
}

const FEEDBACK_COOLDOWN_KEY = 'worldquiz_feedback_submitted';
const COOLDOWN_DAYS = 3;

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onLoginRequest }) => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToastContext();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user submitted feedback recently (within 3 days)
  const isCoolingDown = () => {
    const submitted = localStorage.getItem(FEEDBACK_COOLDOWN_KEY);
    if (!submitted) return false;
    const elapsed = Date.now() - parseInt(submitted, 10);
    return elapsed < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  };

  const [hidden, setHidden] = useState(isCoolingDown());

  if (hidden) return null;

  const handleStarClick = (star: number) => {
    if (!isAuthenticated) {
      onLoginRequest();
      return;
    }
    setRating(star);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onLoginRequest();
      return;
    }
    if (rating === 0) {
      addToast('error', t('feedbackSelectRating'));
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`https://dzzeaesctendsggfdxra.supabase.co/functions/v1/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim().slice(0, 500) || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit feedback');
      }
      localStorage.setItem(FEEDBACK_COOLDOWN_KEY, Date.now().toString());
      addToast('success', t('feedbackThankYou'));
      setHidden(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      addToast('error', 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">{t('feedbackTitle')}</h2>
        <p className="text-center text-muted-foreground mb-10">{t('feedbackSubtitle')}</p>

        <div className="bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-primary/30">
          {/* Star Rating */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-3">{t('feedbackRateUs')}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-125"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <Textarea
            placeholder={isAuthenticated ? t('feedbackPlaceholder') : t('feedbackLoginRequired')}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            disabled={!isAuthenticated}
            onClick={() => !isAuthenticated && onLoginRequest()}
            className="mb-4 bg-background/50 border-border/50 resize-none"
            rows={3}
          />

          {/* Submit */}
          <Button
            variant="netflix"
            className="w-full gap-2"
            onClick={isAuthenticated ? handleSubmit : onLoginRequest}
            disabled={isSubmitting}
          >
            <MessageSquare className="h-4 w-4" />
            {isAuthenticated ? t('feedbackSubmit') : t('signIn')}
          </Button>
        </div>
      </div>
    </section>
  );
};
