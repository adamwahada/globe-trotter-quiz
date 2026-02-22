import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from '@/components/Avatar/AvatarDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { CardType, CARD_DEFINITIONS, PlayerCard } from '@/types/cards';
import { Player } from '@/types/game';
import { CountrySelectionModal } from '@/components/Cards/CountrySelectionModal';

type InputType = 'player' | 'continent' | 'country' | 'playerCard';

interface CardInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: CardType;
  inputType: InputType;
  onConfirm: (data: {
    targetPlayerId?: string;
    targetContinent?: string;
    targetCountry?: string;
    targetCardId?: string;
  }) => void;
}

const CONTINENTS = [
  { id: 'africa', name: 'Africa', emoji: '🌍' },
  { id: 'asia', name: 'Asia', emoji: '🌏' },
  { id: 'europe', name: 'Europe', emoji: '🌍' },
  { id: 'north-america', name: 'North America', emoji: '🌎' },
  { id: 'south-america', name: 'South America', emoji: '🌎' },
  { id: 'oceania', name: 'Oceania', emoji: '🌏' },
];

export const CardInputModal: React.FC<CardInputModalProps> = ({
  isOpen,
  onClose,
  cardType,
  inputType,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const { session, currentPlayer, getPlayersArray } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<{ playerId: string; cardId: string } | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);

  const players = getPlayersArray().filter(p => p.id !== currentPlayer?.id);
  const cardDef = CARD_DEFINITIONS[cardType];

  const handleConfirm = () => {
    if (inputType === 'player' && selectedPlayer) {
      onConfirm({ targetPlayerId: selectedPlayer });
    } else if (inputType === 'continent' && selectedContinent) {
      onConfirm({ targetContinent: selectedContinent });
    } else if (inputType === 'playerCard' && selectedCard) {
      onConfirm({
        targetPlayerId: selectedCard.playerId,
        targetCardId: selectedCard.cardId
      });
    }
    onClose();
  };

  const handleCountrySelect = (country: string) => {
    onConfirm({ targetCountry: country });
    setShowCountryModal(false);
    onClose();
  };

  const renderPlayerSelection = () => (
    <div className="grid gap-3">
      {players.map(player => (
        <button
          key={player.id}
          onClick={() => setSelectedPlayer(player.id)}
          className={`
            flex items-center gap-3 p-4 rounded-xl border transition-all
            ${selectedPlayer === player.id
              ? 'border-primary bg-primary/20 ring-2 ring-primary'
              : 'border-border bg-secondary/50 hover:border-primary/50'}
          `}
        >
          <AvatarDisplay
            avatarId={player.avatar}
            color={player.color}
            size={48}
            className="flex-shrink-0"
          />
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{player.username}</p>
            <p className="text-sm text-muted-foreground">Score: {player.score}</p>
          </div>
        </button>
      ))}
    </div>
  );

  const renderContinentSelection = () => (
    <div className="grid grid-cols-2 gap-3">
      {CONTINENTS.map(continent => (
        <button
          key={continent.id}
          onClick={() => setSelectedContinent(continent.id)}
          className={`
            p-4 rounded-xl border transition-all text-center
            ${selectedContinent === continent.id
              ? 'border-primary bg-primary/20 ring-2 ring-primary'
              : 'border-border bg-secondary/50 hover:border-primary/50'}
          `}
        >
          <span className="text-3xl mb-2 block">{continent.emoji}</span>
          <p className="font-medium text-foreground">{continent.name}</p>
        </button>
      ))}
    </div>
  );

  const renderPlayerCardSelection = () => (
    <div className="space-y-4 max-h-[400px] overflow-y-auto">
      {players.map(player => {
        const cards = (player.playerCards || []).filter(c => !c.isActivated && c.cardType !== 'joker');
        if (cards.length === 0) return null;

        return (
          <div key={player.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <AvatarDisplay
                avatarId={player.avatar}
                color={player.color}
                size={32}
                className="flex-shrink-0"
              />
              <p className="font-medium text-foreground">{player.username}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pl-10">
              {cards.map(card => {
                const def = CARD_DEFINITIONS[card.cardType];
                const isSelected = selectedCard?.playerId === player.id && selectedCard?.cardId === card.id;

                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard({ playerId: player.id, cardId: card.id })}
                    className={`
                      p-3 rounded-lg border transition-all text-center
                      ${isSelected
                        ? 'border-primary bg-primary/20 ring-2 ring-primary'
                        : 'border-border bg-secondary/50 hover:border-primary/50'}
                    `}
                  >
                    <span className="text-2xl block">{def.icon}</span>
                    <p className="text-xs text-foreground mt-1">{def.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {players.every(p => !(p.playerCards || []).some(c => !c.isActivated && c.cardType !== 'joker')) && (
        <p className="text-center text-muted-foreground py-8">No cards available to steal</p>
      )}
    </div>
  );

  const getTitle = () => {
    switch (inputType) {
      case 'player': return t('selectPlayer');
      case 'continent': return t('selectContinent');
      case 'playerCard': return t('selectCard');
      case 'country': return t('selectCountry');
      default: return cardDef.name;
    }
  };

  const canConfirm = () => {
    switch (inputType) {
      case 'player': return !!selectedPlayer;
      case 'continent': return !!selectedContinent;
      case 'playerCard': return !!selectedCard;
      case 'country': return false; // Country selection uses separate modal
      default: return false;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-display">
              <span className="text-2xl">{cardDef.icon}</span>
              {getTitle()}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {inputType === 'player' && renderPlayerSelection()}
            {inputType === 'continent' && renderContinentSelection()}
            {inputType === 'playerCard' && renderPlayerCardSelection()}
            {inputType === 'country' && (
              <div className="text-center py-8">
                <Button
                  variant="netflix"
                  onClick={() => setShowCountryModal(true)}
                  className="w-full"
                >
                  🌍 {t('selectCountry')}
                </Button>
              </div>
            )}
          </div>

          {inputType !== 'country' && (
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                variant="netflix"
                onClick={handleConfirm}
                disabled={!canConfirm()}
              >
                {t('confirm')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Country selection modal */}
      {showCountryModal && (
        <CountrySelectionModal
          isOpen={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          onConfirm={handleCountrySelect}
          guessedCountries={session?.guessedCountries || []}
        />
      )}
    </>
  );
};
