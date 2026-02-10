import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackSectionProps {
  onLoginRequest: () => void;
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onLoginRequest }) => {
  const { t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToastContext();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const { error } = await supabase.from('feedback' as any).insert({
        user_id: user?.id || '',
        username: user?.username || '',
        rating,
        comment: comment.trim().slice(0, 500) || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      addToast('error', 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-8 border border-primary/30">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-display text-foreground mb-2">{t('feedbackThankYou')}</h2>
            <p className="text-muted-foreground">{t('feedbackThankYouDesc')}</p>
          </div>
        </div>
      </section>
    );
  }

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
