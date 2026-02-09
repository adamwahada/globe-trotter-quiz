import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Check, MapPin } from 'lucide-react';

interface CountrySelectionOverlayProps {
  isActive: boolean;
  selectedCountry: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CountrySelectionOverlay: React.FC<CountrySelectionOverlayProps> = ({
  isActive,
  selectedCountry,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();

  if (!isActive) return null;

  return (
    <>
      {/* Top banner indicating selection mode */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-primary/90 backdrop-blur-sm text-primary-foreground py-3 px-4 flex items-center justify-between shadow-lg animate-fade-in">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 animate-bounce" />
          <div>
            <p className="font-display text-sm font-bold">📍 {t('selectCountry') || 'Pick Your Country'}</p>
            <p className="text-xs opacity-80">
              {selectedCountry
                ? 'Confirm your selection below'
                : 'Click any unguessed country on the map'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="text-primary-foreground hover:bg-primary-foreground/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Confirmation card when a country is selected */}
      {selectedCountry && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-card border-2 border-primary rounded-2xl p-5 shadow-2xl animate-fade-in min-w-[280px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                {t('selectCountry') || 'Country Selection'}
              </p>
              <p className="text-sm font-display text-foreground">
                ✅ Country selected
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 gap-2">
              <X className="h-4 w-4" />
              {t('cancel')}
            </Button>
            <Button variant="netflix" onClick={onConfirm} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              {t('confirm')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
