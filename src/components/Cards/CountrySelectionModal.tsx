import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { getAllCountries, getCountryFlag } from '@/utils/countryData';

interface CountrySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (country: string) => void;
  guessedCountries: string[];
}

export const CountrySelectionModal: React.FC<CountrySelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  guessedCountries,
}) => {
  const { t } = useLanguage();
  const { session } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get all unguessed countries
  const allCountries = getAllCountries();
  const availableCountries = allCountries.filter(c => !guessedCountries.includes(c));

  // Filter by search query
  const filteredCountries = availableCountries.filter(country =>
    country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCountry(null);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (selectedCountry) {
      onConfirm(selectedCountry);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <span className="text-2xl">📍</span>
            {t('selectCountry')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={'Search countries...'}
              className="pl-10"
            />
          </div>

          {/* Countries list */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-secondary/30">
            {filteredCountries.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {searchQuery ? 'No countries found' : 'No countries available'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                {filteredCountries.slice(0, 50).map((country) => {
                  const isSelected = selectedCountry === country;
                  return (
                    <button
                      key={country}
                      onClick={() => setSelectedCountry(country)}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border transition-all text-left
                        ${isSelected
                          ? 'border-primary bg-primary/20 ring-2 ring-primary'
                          : 'border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary/70'}
                      `}
                    >
                      <span className="text-xl">{getCountryFlag(country)}</span>
                      <span className="text-sm font-medium text-foreground truncate">{country}</span>
                    </button>
                  );
                })}
                {filteredCountries.length > 50 && (
                  <div className="col-span-full text-center text-xs text-muted-foreground py-2">
                    {`Showing first 50 of ${filteredCountries.length} countries`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="netflix"
            onClick={handleConfirm}
            disabled={!selectedCountry}
          >
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};