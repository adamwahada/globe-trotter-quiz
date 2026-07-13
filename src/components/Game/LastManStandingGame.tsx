import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { WorldMap } from '@/components/Map/WorldMap';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from '@/components/Avatar/AvatarDisplay';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { playersMapToArray } from '@/types/game';
import {
  LMS_CONTINENTS,
  LMS_CONTINENT_PHASE_TIME,
  LMS_LOCATION_PHASE_TIME,
  LMS_REVEAL_TIME,
  LMS_COUNTDOWN_TIME,
  LMS_RESULTS_TIME,
  calculateHeartLoss,
  LMSRoundState,
  LMSPlayerSubmission,
  LMSPlayerState,
  LMSContinent,
} from '@/types/game';
import { getRandomUnplayedCountry } from '@/utils/countryData';
import { countryContinent } from '@/utils/countryData';
import { LogOut, Trophy, MapPin, CheckCircle, XCircle, Heart, Shield, Clock, Users, X } from 'lucide-react';
import { removePlayerFromSession, clearRecoveryData } from '@/services/gameSessionService';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated countdown overlay (3…2…1) */
const RoundCountdown: React.FC<{ startTime: number }> = ({ startTime }) => {
  const [count, setCount] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, 3 - elapsed);
  });
  const { playToastSound } = useSound();

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const rem = Math.max(0, 3 - elapsed);
      setCount(rem);
      if (rem > 0) playToastSound('game');
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime, playToastSound]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="text-center animate-fade-in">
        <p className="text-lg text-muted-foreground mb-4 font-display tracking-widest uppercase">
          Get ready...
        </p>
        <div
          key={count}
          className="text-[8rem] font-display text-destructive drop-shadow-[0_0_60px_hsl(var(--destructive))] animate-scale-in"
        >
          {count || '💀'}
        </div>
      </div>
    </div>
  );
};

/** Timer bar component */
const PhaseTimer: React.FC<{
  startTime: number;
  totalSeconds: number;
  onExpire: () => void;
  label: string;
}> = ({ startTime, totalSeconds, onExpire, label }) => {
  const [pct, setPct] = useState(100);
  const [remaining, setRemaining] = useState(totalSeconds);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const iv = setInterval(() => {
      const e = (Date.now() - startTime) / 1000;
      const p = Math.max(0, 100 - (e / totalSeconds) * 100);
      setPct(p);
      setRemaining(Math.max(0, totalSeconds - e));
      if (p <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    }, 100);
    return () => clearInterval(iv);
  }, [startTime, totalSeconds, onExpire]);

  const color =
    pct > 60 ? 'hsl(var(--success))' : pct > 30 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs px-0.5">
        <span className="flex items-center gap-1 text-muted-foreground font-medium">
          <Clock className="h-3 w-3" />
          {label}
        </span>
        <span style={{ color }} className="font-bold tabular-nums text-sm">
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="h-3 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/** Hearts display */
const HeartsDisplay: React.FC<{ hearts: number; maxHearts: number }> = ({ hearts, maxHearts }) => {
  const fullHearts = Math.floor(hearts);
  const hasHalf = hearts % 1 !== 0;
  const emptyHearts = maxHearts - fullHearts - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {Array.from({ length: fullHearts }).map((_, i) => (
        <Heart key={`full-${i}`} className="h-4 w-4 text-destructive fill-destructive" />
      ))}
      {hasHalf && (
        <div className="relative">
          <Heart className="h-4 w-4 text-muted-foreground" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Heart className="h-4 w-4 text-destructive fill-destructive" />
          </div>
        </div>
      )}
      {Array.from({ length: Math.max(0, emptyHearts) }).map((_, i) => (
        <Heart key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />
      ))}
    </div>
  );
};

/** Continent selection overlay */
const ContinentSelector: React.FC<{
  onSelect: (continent: LMSContinent) => void;
  disabled: boolean;
  selected: LMSContinent | null;
  feedback: { correct: boolean; correctContinent: LMSContinent } | null;
  countryName: string;
  phaseStartTime: number;
  onTimerExpire: () => void;
}> = ({ onSelect, disabled, selected, feedback, countryName, phaseStartTime, onTimerExpire }) => {
  const continentImages: Record<LMSContinent, string> = {
    'Africa': '/continents/africa.webp',
    'Asia': '/continents/asia.webp',
    'Europe': '/continents/europe.webp',
    'North America': '/continents/north-america.webp',
    'South America': '/continents/south-america.webp',
    'Oceania': '/continents/oceania.webp',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 pt-5 pb-3 text-center">
          <h3 className="text-xl font-display text-foreground mb-1">
            {feedback ? (feedback.correct ? '✅ Correct!' : '❌ Wrong Continent') : 'Which Continent?'}
          </h3>
          <p className="text-lg font-display text-primary mb-2">🎯 {countryName}</p>
          {feedback && !feedback.correct && (
            <p className="text-sm text-muted-foreground">
              The correct continent is <span className="font-bold text-foreground">{feedback.correctContinent}</span>
            </p>
          )}
        </div>

        {/* Countdown timer */}
        {!feedback && (
          <div className="px-6 pb-3">
            <PhaseTimer
              startTime={phaseStartTime}
              totalSeconds={LMS_CONTINENT_PHASE_TIME}
              onExpire={onTimerExpire}
              label="Select continent"
            />
          </div>
        )}

        {!feedback && (
          <div className="grid grid-cols-3 gap-3 px-6 pb-6">
            {LMS_CONTINENTS.map((continent) => (
              <button
                key={continent}
                onClick={() => !disabled && onSelect(continent)}
                disabled={disabled}
                className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center gap-1.5 ${
                  selected === continent
                    ? 'border-destructive bg-destructive/20 scale-105'
                    : 'border-border bg-secondary/30 hover:border-destructive/50 hover:bg-destructive/5'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <img
                  src={continentImages[continent]}
                  alt={continent}
                  className="w-16 h-16 object-contain"
                  loading="eager"
                />
                <span className="text-xs font-medium text-foreground leading-tight">{continent}</span>
              </button>
            ))}
          </div>
        )}

        {feedback && (
          <div className="px-6 pb-6">
            <div className={`p-4 rounded-xl text-center ${feedback.correct ? 'bg-success/20 border border-success/30' : 'bg-destructive/20 border border-destructive/30'}`}>
              <p className="text-sm font-medium">
                {feedback.correct
                  ? '🎯 Moving to exact location...'
                  : '💔 -0.5 heart for wrong continent'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** Confirm modal for map click */
const ConfirmModal: React.FC<{
  country: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ country, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm p-4">
    <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
      <div className="px-6 pt-6 pb-4 text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-xl font-display text-foreground mb-1">Confirm Location?</h3>
        <p className="text-xs text-destructive font-medium">
          ⚠️ Once confirmed, you cannot change your answer.
        </p>
      </div>
      <div className="flex gap-3 px-6 pb-6">
        <Button variant="outline" className="flex-1 gap-2" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button variant="default" className="flex-1 gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={onConfirm}>
          <CheckCircle className="h-4 w-4" />
          Confirm
        </Button>
      </div>
    </div>
  </div>
);

/** Round results modal */
const LMSRoundResults: React.FC<{
  roundState: LMSRoundState;
  players: ReturnType<typeof playersMapToArray>;
  lmsStates: { [id: string]: LMSPlayerState };
  maxHearts: number;
  nextRoundIn: number;
}> = ({ roundState, players, lmsStates, maxHearts, nextRoundIn }) => {
  const [countdown, setCountdown] = useState(nextRoundIn);

  useEffect(() => {
    setCountdown(nextRoundIn);
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [nextRoundIn, roundState.roundNumber]);

  // Sort: alive first (by hearts desc), then eliminated
  const sorted = [...players].sort((a, b) => {
    const aState = lmsStates[a.id];
    const bState = lmsStates[b.id];
    if (aState?.isEliminated && !bState?.isEliminated) return 1;
    if (!aState?.isEliminated && bState?.isEliminated) return -1;
    return (bState?.hearts || 0) - (aState?.hearts || 0);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-destructive/20 to-primary/10 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">Round {roundState.roundNumber} Results</h2>
              <p className="text-sm text-muted-foreground">
                🎯 {roundState.country} — {roundState.correctContinent}
              </p>
            </div>
          </div>
        </div>

        {/* Player results */}
        <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
          {sorted.map((player, idx) => {
            const sub = roundState.submissions?.[player.id];
            const state = lmsStates[player.id];
            const isEliminated = state?.isEliminated;
            const heartsNow = state?.hearts ?? 0;
            const loss = sub?.heartLoss ?? 0;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-fade-in ${
                  isEliminated
                    ? 'border-destructive/40 bg-destructive/10 opacity-60'
                    : loss === 0
                      ? 'border-success/40 bg-success/10'
                      : loss === 0.5
                        ? 'border-warning/40 bg-warning/10'
                        : 'border-destructive/40 bg-destructive/10'
                }`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <AvatarDisplay
                  avatarId={player.avatar}
                  color={player.color}
                  size={36}
                  className="flex-shrink-0 border-2 border-background"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm truncate ${isEliminated ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {player.username}
                    </p>
                    {isEliminated && <span className="text-xs text-destructive font-bold">💀 OUT</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {sub?.isContinentCorrect ? <CheckCircle className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      {sub?.selectedContinent || '—'}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {sub?.isCountryCorrect ? <CheckCircle className="h-3 w-3 text-success" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      {sub?.selectedCountry || '—'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    {loss > 0 && (
                      <span className="text-sm font-bold text-destructive">-{loss}</span>
                    )}
                    {loss === 0 && sub && (
                      <span className="text-sm font-bold text-success">✓</span>
                    )}
                    <Heart className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <HeartsDisplay hearts={heartsNow} maxHearts={maxHearts} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border text-center bg-secondary/20">
          <p className="text-sm text-muted-foreground">
            Next round in{' '}
            <span className="font-bold text-foreground tabular-nums text-lg">{countdown}s</span>
          </p>
        </div>
      </div>
    </div>
  );
};

/** Final winner / podium screen */
const LMSWinnerScreen: React.FC<{
  players: ReturnType<typeof playersMapToArray>;
  lmsStates: { [id: string]: LMSPlayerState };
  maxHearts: number;
  onBack: () => void;
}> = ({ players, lmsStates, maxHearts, onBack }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Sort: winner first (most hearts, not eliminated), then by elimination round (later = better)
  const sorted = [...players].sort((a, b) => {
    const aState = lmsStates[a.id];
    const bState = lmsStates[b.id];
    if (aState?.isEliminated && !bState?.isEliminated) return 1;
    if (!aState?.isEliminated && bState?.isEliminated) return -1;
    if (!aState?.isEliminated && !bState?.isEliminated) return (bState?.hearts || 0) - (aState?.hearts || 0);
    return (bState?.eliminatedInRound || 0) - (aState?.eliminatedInRound || 0);
  });

  const winner = sorted[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 60}%`,
              animationDelay: `${(i * 0.3) % 3}s`,
              animationDuration: `${2 + (i % 3)}s`,
              fontSize: `${8 + (i % 3) * 6}px`,
            }}
          >
            💀
          </div>
        ))}
      </div>

      <div className={`relative w-full max-w-lg transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-warning animate-bounce" />
            <h1 className="text-4xl font-display text-foreground">Last One Standing!</h1>
            <Trophy className="h-8 w-8 text-warning animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>

        {/* Winner highlight */}
        {winner && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 border-2 border-warning/40">
              <AvatarDisplay
                avatarId={winner.avatar}
                color={winner.color}
                size={80}
                className="mx-auto mb-3 border-4 border-warning shadow-lg"
              />
              <p className="text-2xl font-display text-foreground mb-2">{winner.username}</p>
              <div className="flex items-center justify-center gap-1">
                <HeartsDisplay hearts={lmsStates[winner.id]?.hearts || 0} maxHearts={maxHearts} />
              </div>
              <p className="text-4xl mt-2">👑</p>
            </div>
          </div>
        )}

        {/* Other players */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
          {sorted.slice(1).map((player, i) => {
            const state = lmsStates[player.id];
            return (
              <div key={player.id} className="flex items-center gap-3 opacity-70">
                <span className="w-8 text-center text-muted-foreground font-bold">#{i + 2}</span>
                <AvatarDisplay avatarId={player.avatar} color={player.color} size={32} className="flex-shrink-0" />
                <span className="flex-1 text-sm text-foreground">{player.username}</span>
                <span className="text-xs text-muted-foreground">
                  {state?.isEliminated ? `💀 Round ${state.eliminatedInRound}` : `${state?.hearts || 0} ❤️`}
                </span>
              </div>
            );
          })}
        </div>

        <Button variant="default" className="w-full" onClick={onBack}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

// ─── Main LastManStandingGame ────────────────────────────────────────────────

const LastManStandingGame: React.FC = () => {
  const { session, currentPlayer, updateGameState, endGame, getPlayersArray } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound } = useSound();
  const navigate = useNavigate();

  const players = getPlayersArray ? getPlayersArray() : playersMapToArray(session?.players);
  const isHost = session?.host === currentPlayer?.id;

  const roundState = session?.lmsRoundState as LMSRoundState | null | undefined;
  const lmsStates = (session?.lmsPlayerStates || {}) as { [id: string]: LMSPlayerState };
  const currentRound = session?.currentRound || 0;
  const maxHearts = session?.startingHearts || 5;
  const guessedCountries = session?.guessedCountries || [];

  // Local UI state
  const [pendingCountry, setPendingCountry] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<LMSContinent | null>(null);
  const [continentFeedback, setContinentFeedback] = useState<{ correct: boolean; correctContinent: LMSContinent } | null>(null);
  const [continentSubmitted, setContinentSubmitted] = useState(false);
  const [locationSubmitted, setLocationSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  // Track if player already advanced to location phase after correct continent
  const [inLocationPhase, setInLocationPhase] = useState(false);

  // Refs
  const sessionRef = useRef(session);
  const roundStateRef = useRef(roundState);
  const playersRef = useRef(players);
  const isHostRef = useRef(isHost);
  const currentRoundRef = useRef(currentRound);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { roundStateRef.current = roundState; }, [roundState]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);

  const submittedRoundRef = useRef<number>(-1);
  const timerExpiredRoundRef = useRef<number>(-1);

  // Check if current player is eliminated
  const myState = lmsStates[currentPlayer?.id || ''];
  const isEliminated = myState?.isEliminated || false;

  // Reset local state when new round starts
  useEffect(() => {
    if (roundState?.phase === 'continent' || roundState?.phase === 'reveal') {
      setPendingCountry(null);
      setShowConfirmModal(false);
      setSelectedContinent(null);
      setContinentFeedback(null);
      setContinentSubmitted(false);
      setLocationSubmitted(false);
      setInLocationPhase(false);
      setShowResults(false);
    }
    if (roundState?.phase === 'results') {
      setShowConfirmModal(false);
      setShowResults(true);
    }
  }, [roundState?.phase, roundState?.roundNumber]);

  // ── HOST: moveToResults ───────────────────────────────────────────────────
  const moveToResults = useCallback(async (rs: LMSRoundState) => {
    if (!isHostRef.current) return;
    const sess = sessionRef.current;
    if (!sess) return;

    const currentLmsStates = { ...(sess.lmsPlayerStates || {}) };

    // Fill in submissions for players who didn't submit
    const allSubs = { ...(rs.submissions || {}) };
    playersRef.current.forEach(p => {
      const pState = currentLmsStates[p.id];
      if (pState?.isEliminated) return;
      if (!allSubs[p.id]) {
        // No submission at all — both wrong
        allSubs[p.id] = {
          selectedContinent: null,
          continentSubmittedAt: null,
          isContinentCorrect: false,
          selectedCountry: null,
          countryConfirmedAt: null,
          isCountryCorrect: false,
          heartLoss: 1,
          phase: 'done',
        };
      } else if (allSubs[p.id].phase !== 'done') {
        // Submitted continent but not location — recalculate heartLoss
        const sub = allSubs[p.id];
        const loss = calculateHeartLoss(sub.isContinentCorrect, false);
        allSubs[p.id] = { ...sub, heartLoss: loss, phase: 'done' };
      }
    });

    // Apply REMAINING heart loss (continent penalty was already applied immediately)
    const newLmsStates = { ...currentLmsStates };
    const newlyEliminated: string[] = [];

    Object.entries(allSubs).forEach(([pid, sub]) => {
      if (!newLmsStates[pid] || newLmsStates[pid].isEliminated) return;
      // Continent penalty (0.5) was already deducted immediately. Only deduct the remainder.
      const continentAlreadyDeducted = sub.isContinentCorrect ? 0 : 0.5;
      const remainingLoss = Math.max(0, sub.heartLoss - continentAlreadyDeducted);
      const newHearts = Math.max(0, (newLmsStates[pid].hearts || 0) - remainingLoss);
      newLmsStates[pid] = {
        ...newLmsStates[pid],
        hearts: newHearts,
        isEliminated: newHearts <= 0,
        ...(newHearts <= 0 ? { eliminatedInRound: rs.roundNumber } : {}),
      };
      if (newHearts <= 0) newlyEliminated.push(pid);
    });

    await updateGameState({
      lmsPlayerStates: newLmsStates,
      lmsRoundState: {
        ...rs,
        submissions: allSubs,
        phase: 'results',
        phaseStartTime: Date.now(),
      },
    } as any);
  }, [updateGameState]);

  // ── HOST: advanceRound ────────────────────────────────────────────────────
  const advanceRound = useCallback(async () => {
    if (!isHostRef.current) return;
    const sess = sessionRef.current;
    const rs = roundStateRef.current;
    if (!sess) return;

    const currentLmsStates = sess.lmsPlayerStates || {};

    // Check how many players are alive
    const alivePlayers = Object.entries(currentLmsStates).filter(([_, s]) => !s.isEliminated);

    if (alivePlayers.length <= 1) {
      // Game over
      const allGuessed = [...(sess.guessedCountries || []), ...(rs?.country ? [rs.country] : [])];
      await updateGameState({
        guessedCountries: allGuessed,
        lmsRoundState: null,
        currentRound: (currentRoundRef.current || 0) + 1,
      } as any);
      await endGame();
      return;
    }

    const nextRound = (currentRoundRef.current || 0) + 1;
    const allGuessed = [...(sess.guessedCountries || []), ...(rs?.country ? [rs.country] : [])];
    const nextCountry = getRandomUnplayedCountry(allGuessed);
    if (!nextCountry) { await endGame(); return; }

    const correctContinent = (countryContinent[nextCountry] || 'Europe') as LMSContinent;

    await updateGameState({
      currentRound: nextRound,
      guessedCountries: allGuessed,
      lmsRoundState: {
        roundNumber: nextRound,
        country: nextCountry,
        correctContinent,
        phase: 'reveal',
        phaseStartTime: Date.now(),
        submissions: {},
      },
    } as any);
  }, [updateGameState, endGame]);

  // ── HOST: Orchestrate round phases ────────────────────────────────────────
  useEffect(() => {
    if (!isHost || !roundState) return;
    const phase = roundState.phase;

    if (phase === 'reveal') {
      const delay = Math.max(0, LMS_REVEAL_TIME - (Date.now() - roundState.phaseStartTime));
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        await updateGameState({
          lmsRoundState: { ...roundStateRef.current!, phase: 'countdown', phaseStartTime: Date.now() },
        } as any);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'countdown') {
      const delay = Math.max(0, LMS_COUNTDOWN_TIME - (Date.now() - roundState.phaseStartTime));
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        await updateGameState({
          lmsRoundState: { ...roundStateRef.current!, phase: 'continent', phaseStartTime: Date.now() },
        } as any);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'continent') {
      // After continent phase time, move to location phase — keep original phaseStartTime (30s continuous timer)
      const delay = Math.max(0, (LMS_CONTINENT_PHASE_TIME * 1000 + 200) - (Date.now() - roundState.phaseStartTime));
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        const rs = roundStateRef.current;
        if (!rs || rs.phase !== 'continent') return;
        // DON'T reset phaseStartTime — keep the original round start for the continuous 30s timer
        await updateGameState({
          lmsRoundState: { ...rs, phase: 'location' },
        } as any);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'location') {
      // Total round time = 30s from the original phaseStartTime (continent start)
      const totalRoundMs = (LMS_CONTINENT_PHASE_TIME + LMS_LOCATION_PHASE_TIME) * 1000 + 200;
      const delay = Math.max(0, totalRoundMs - (Date.now() - roundState.phaseStartTime));
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        const rs = roundStateRef.current;
        if (!rs || rs.phase !== 'location') return;
        if (timerExpiredRoundRef.current === rs.roundNumber) return;
        timerExpiredRoundRef.current = rs.roundNumber;
        await moveToResults(rs);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'results') {
      const delay = Math.max(0, LMS_RESULTS_TIME - (Date.now() - roundState.phaseStartTime));
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        await advanceRound();
      }, delay);
      return () => clearTimeout(tid);
    }
  }, [roundState?.phase, roundState?.roundNumber, isHost, updateGameState, moveToResults, advanceRound]);

  // ── HOST: Start first round ────────────────────────────────────────────────
  useEffect(() => {
    if (!isHost || !session) return;
    if (session.status !== 'playing') return;
    if (roundState !== null && roundState !== undefined) return;

    // Initialize LMS player states
    const initialStates: { [id: string]: LMSPlayerState } = {};
    Object.keys(session.players || {}).forEach(pid => {
      initialStates[pid] = {
        hearts: session.startingHearts || 5,
        isEliminated: false,
      };
    });

    const firstCountry = getRandomUnplayedCountry([]);
    if (!firstCountry) return;
    const correctContinent = (countryContinent[firstCountry] || 'Europe') as LMSContinent;

    updateGameState({
      currentRound: 1,
      lmsPlayerStates: initialStates,
      lmsRoundState: {
        roundNumber: 1,
        country: firstCountry,
        correctContinent,
        phase: 'reveal',
        phaseStartTime: Date.now(),
        submissions: {},
      },
    } as any);
  }, [session?.status, isHost]);

  // ── Show winner when session finishes ─────────────────────────────────────
  useEffect(() => {
    if (session?.status === 'finished') setShowWinner(true);
  }, [session?.status]);

  // ── Continent selection ────────────────────────────────────────────────────
  const handleContinentSelect = useCallback(async (continent: LMSContinent) => {
    if (!currentPlayer || !roundState || continentSubmitted || isEliminated) return;
    if (roundState.phase !== 'continent') return;
    if (submittedRoundRef.current === roundState.roundNumber) return;

    setSelectedContinent(continent);
    setContinentSubmitted(true);

    const isCorrect = continent === roundState.correctContinent;
    setContinentFeedback({ correct: isCorrect, correctContinent: roundState.correctContinent });

    // Submit continent choice to Firebase
    const sub: LMSPlayerSubmission = {
      selectedContinent: continent,
      continentSubmittedAt: Date.now(),
      isContinentCorrect: isCorrect,
      selectedCountry: null,
      countryConfirmedAt: null,
      isCountryCorrect: false,
      heartLoss: isCorrect ? 0 : 0.5,
      phase: 'continent',
    };

    const updatedSubs = {
      ...(roundState.submissions || {}),
      [currentPlayer.id]: sub,
    };

    // If wrong, immediately apply 0.5 heart loss to Firebase
    if (!isCorrect) {
      const currentHearts = myState?.hearts || 0;
      const newHearts = Math.max(0, currentHearts - 0.5);
      const newLmsStates = {
        ...(sessionRef.current?.lmsPlayerStates || {}),
        [currentPlayer.id]: {
          ...(lmsStates[currentPlayer.id] || { hearts: 0, isEliminated: false }),
          hearts: newHearts,
          isEliminated: newHearts <= 0,
          ...(newHearts <= 0 ? { eliminatedInRound: roundState.roundNumber } : {}),
        },
      };
      await updateGameState({
        lmsRoundState: { ...roundState, submissions: updatedSubs },
        lmsPlayerStates: newLmsStates,
      } as any);
      playToastSound('error');
      addToast('error', `❌ Wrong! It's ${roundState.correctContinent}. -0.5 ❤️`);
    } else {
      await updateGameState({
        lmsRoundState: { ...roundState, submissions: updatedSubs },
      } as any);
      playToastSound('success');
      addToast('success', '✅ Correct continent! Select the exact location now.');
    }

    // After brief feedback, dismiss overlay and advance to location phase
    setTimeout(() => {
      setContinentFeedback(null);
      setInLocationPhase(true);
    }, isCorrect ? 800 : 1200);
  }, [currentPlayer, roundState, continentSubmitted, isEliminated, updateGameState, playToastSound, addToast, myState, lmsStates]);

  // ── Map click: select country ────────────────────────────────────────────
  const handleCountryClick = useCallback((country: string) => {
    if (locationSubmitted || isEliminated) return;
    // Only allow during location phase (global) or if player advanced early
    const inLocPhase = roundState?.phase === 'location' || (inLocationPhase && roundState?.phase === 'continent');
    if (!inLocPhase) return;

    setPendingCountry(country);
    setShowConfirmModal(true);
  }, [locationSubmitted, isEliminated, roundState?.phase, inLocationPhase]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirmModal(false);
    setPendingCountry(null);
  }, []);

  // ── Confirm country ───────────────────────────────────────────────────────
  const handleConfirmCountry = useCallback(async () => {
    if (!currentPlayer || !roundState || locationSubmitted || !pendingCountry || isEliminated) return;

    setShowConfirmModal(false);
    setLocationSubmitted(true);
    submittedRoundRef.current = roundState.roundNumber;

    const isCountryCorrect = pendingCountry === roundState.country;
    const existingSub = roundState.submissions?.[currentPlayer.id];
    const isContinentCorrect = existingSub?.isContinentCorrect || false;
    const heartLoss = calculateHeartLoss(isContinentCorrect, isCountryCorrect);

    const updatedSub: LMSPlayerSubmission = {
      selectedContinent: existingSub?.selectedContinent || null,
      continentSubmittedAt: existingSub?.continentSubmittedAt || null,
      isContinentCorrect,
      selectedCountry: pendingCountry,
      countryConfirmedAt: Date.now(),
      isCountryCorrect,
      heartLoss,
      phase: 'done',
    };

    const updatedSubs = {
      ...(roundState.submissions || {}),
      [currentPlayer.id]: updatedSub,
    };

    await updateGameState({
      lmsRoundState: { ...roundState, submissions: updatedSubs },
    } as any);

    if (isCountryCorrect) {
      playToastSound('success');
      addToast('success', heartLoss === 0 ? '🎯 Perfect! No hearts lost!' : `✓ Correct country! -${heartLoss} ❤️`);
    } else {
      playToastSound('error');
      addToast('error', `✗ Wrong! -${heartLoss} ❤️`);
    }
  }, [currentPlayer, roundState, locationSubmitted, pendingCountry, isEliminated, updateGameState, playToastSound, addToast]);

  // ── Timer expire handlers ─────────────────────────────────────────────────
  const handleContinentTimerExpire = useCallback(async () => {
    if (continentSubmitted || isEliminated || !currentPlayer) return;
    setContinentSubmitted(true);
    setContinentFeedback({ correct: false, correctContinent: roundState?.correctContinent || 'Europe' as LMSContinent });

    // Immediately apply 0.5 heart loss for not answering
    const currentHearts = myState?.hearts || 0;
    const newHearts = Math.max(0, currentHearts - 0.5);
    const newLmsStates = {
      ...(sessionRef.current?.lmsPlayerStates || {}),
      [currentPlayer.id]: {
        ...(lmsStates[currentPlayer.id] || { hearts: 0, isEliminated: false }),
        hearts: newHearts,
        isEliminated: newHearts <= 0,
        ...(newHearts <= 0 ? { eliminatedInRound: roundState?.roundNumber || 0 } : {}),
      },
    };

    // Submit empty continent to Firebase
    const sub: LMSPlayerSubmission = {
      selectedContinent: null,
      continentSubmittedAt: null,
      isContinentCorrect: false,
      selectedCountry: null,
      countryConfirmedAt: null,
      isCountryCorrect: false,
      heartLoss: 1, // will be recalculated when location is also evaluated
      phase: 'continent',
    };
    const updatedSubs = {
      ...(roundState?.submissions || {}),
      [currentPlayer.id]: sub,
    };

    await updateGameState({
      lmsRoundState: { ...roundState!, submissions: updatedSubs },
      lmsPlayerStates: newLmsStates,
    } as any);

    playToastSound('error');
    addToast('error', `⏰ Time's up! It's ${roundState?.correctContinent}. -0.5 ❤️`);

    // After showing correct continent, advance to location phase
    setTimeout(() => {
      setContinentFeedback(null);
      setInLocationPhase(true);
    }, 1200);
  }, [continentSubmitted, isEliminated, currentPlayer, roundState, myState, lmsStates, updateGameState, playToastSound, addToast]);

  const handleLocationTimerExpire = useCallback(() => {
    setShowConfirmModal(false);
    if (!locationSubmitted) {
      setLocationSubmitted(true);
    }
  }, [locationSubmitted]);

  // ── Quit ──────────────────────────────────────────────────────────────────
  const handleQuit = async () => {
    if (session && currentPlayer) await removePlayerFromSession(session.code, currentPlayer.id);
    clearRecoveryData();
    navigate('/');
  };

  // ── Winner screen ─────────────────────────────────────────────────────────
  if (showWinner) {
    return <LMSWinnerScreen players={players} lmsStates={lmsStates} maxHearts={maxHearts} onBack={() => navigate('/')} />;
  }

  if (!roundState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">💀</div>
          <p className="text-muted-foreground">Loading Last Man Standing...</p>
        </div>
      </div>
    );
  }

  const isContinent = roundState.phase === 'continent';
  const isLocation = roundState.phase === 'location';
  const canInteractMap = (isLocation || (inLocationPhase && isContinent)) && !locationSubmitted && !isEliminated;

  // Count alive players
  const aliveCount = Object.values(lmsStates).filter(s => !s.isEliminated).length;

  // Live sidebar: sorted by hearts desc
  const rankedPlayers = [...players].sort((a, b) => {
    const aState = lmsStates[a.id];
    const bState = lmsStates[b.id];
    if (aState?.isEliminated && !bState?.isEliminated) return 1;
    if (!aState?.isEliminated && bState?.isEliminated) return -1;
    return (bState?.hearts || 0) - (aState?.hearts || 0);
  }).slice(0, 8);

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      <ReconnectionBanner />

      {/* ── Header ── */}
      <header className="shrink-0 z-30 flex items-center justify-between px-4 py-2.5 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/30">
            <Shield className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wide leading-none">
              Round {roundState.roundNumber}
            </span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary border border-border">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{aliveCount} alive</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* My hearts */}
          {currentPlayer && (
            <div className="flex flex-col items-center px-3 py-1 rounded-xl bg-destructive/15 border border-destructive/40">
              <span className="text-[10px] text-destructive/70 font-medium uppercase tracking-wide leading-none">Hearts</span>
              <HeartsDisplay hearts={myState?.hearts || 0} maxHearts={maxHearts} />
            </div>
          )}

          <Button variant="outline" size="sm" onClick={handleQuit} className="gap-1.5 h-7 text-xs px-2">
            <LogOut className="h-3 w-3" />
            Quit
          </Button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: map area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Country name banner */}
          <div className={`shrink-0 text-center py-2.5 px-4 border-b border-border transition-colors ${
            roundState.phase === 'reveal' || roundState.phase === 'countdown'
              ? 'bg-destructive/10'
              : isContinent
                ? 'bg-warning/10'
                : isLocation
                  ? 'bg-card'
                  : 'bg-secondary/30'
          }`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-medium">
              {roundState.phase === 'reveal' ? 'Memorize this country...' :
               roundState.phase === 'countdown' ? 'Get ready!' :
               (isContinent && !inLocationPhase) ? '🌍 Select the continent first!' :
               (isLocation || inLocationPhase) ? '📍 Find this country on the map' :
               `✅ Round ${roundState.roundNumber} complete`}
            </p>
            <h2 className="text-2xl md:text-3xl font-display text-foreground leading-tight">
              {roundState.country}
            </h2>
            {/* Show correct continent when player has submitted and is in location phase */}
            {(inLocationPhase || isLocation) && continentSubmitted && (
              <p className="text-xs text-muted-foreground mt-0.5">
                🌍 <span className="font-medium text-foreground">{roundState.correctContinent}</span>
              </p>
            )}
          </div>

          {/* Timer - only show location timer here (continent timer is in the overlay) */}
          {(isLocation || (inLocationPhase && isContinent)) && (
            <div className={`shrink-0 px-4 py-2.5 border-b border-border ${locationSubmitted ? 'bg-secondary/30' : 'bg-background'}`}>
              <PhaseTimer
                startTime={roundState.phaseStartTime}
                totalSeconds={LMS_CONTINENT_PHASE_TIME + LMS_LOCATION_PHASE_TIME}
                onExpire={handleLocationTimerExpire}
                label={locationSubmitted ? 'Waiting for results...' : 'Select exact location'}
              />
              {locationSubmitted && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✅ Answer submitted. Waiting for round to end...
                </p>
              )}
            </div>
          )}

          {/* Eliminated overlay */}
          {isEliminated && (
            <div className="shrink-0 px-4 py-3 bg-destructive/20 border-b border-destructive/30 text-center">
              <p className="text-sm font-bold text-destructive">💀 You have been eliminated! Spectating...</p>
            </div>
          )}

          {/* Map */}
          <div className="flex-1 relative overflow-hidden p-2">
            {/* Blur overlay during reveal */}
            {roundState.phase === 'reveal' && (
              <div className="absolute inset-2 z-10 rounded-xl backdrop-blur-md bg-background/70 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                  <p className="text-5xl mb-3 animate-pulse">💀</p>
                  <p className="text-lg font-display text-foreground">{roundState.country}</p>
                  <p className="text-sm text-muted-foreground mt-1">Survive this round...</p>
                </div>
              </div>
            )}

            {/* Countdown overlay */}
            {roundState.phase === 'countdown' && (
              <div className="absolute inset-2 z-10 rounded-xl overflow-hidden">
                <RoundCountdown startTime={roundState.phaseStartTime} />
              </div>
            )}

            <WorldMap
              currentCountry={canInteractMap && pendingCountry && !showConfirmModal ? pendingCountry : undefined}
              guessedCountries={guessedCountries}
              correctCountries={session?.correctCountries || []}
              wrongCountries={session?.wrongCountries || []}
              onCountryClick={canInteractMap ? handleCountryClick : () => {}}
              disabled={!canInteractMap}
              speedRaceMode={true}
              resetKey={currentRound}
            />
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-52 shrink-0 border-l border-border bg-card/50 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border bg-card">
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-destructive" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">Survivors</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {rankedPlayers.map((player) => {
              const isMe = player.id === currentPlayer?.id;
              const state = lmsStates[player.id];
              const eliminated = state?.isEliminated;
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    eliminated
                      ? 'border-destructive/30 bg-destructive/5 opacity-50'
                      : isMe
                        ? 'border-destructive/50 bg-destructive/10'
                        : 'border-border/50 bg-secondary/20'
                  }`}
                >
                  <AvatarDisplay
                    avatarId={player.avatar}
                    color={player.color}
                    size={24}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate font-medium ${
                      eliminated ? 'text-muted-foreground line-through' : isMe ? 'text-destructive' : 'text-foreground'
                    }`}>
                      {isMe ? 'You' : player.username}
                    </p>
                    <HeartsDisplay hearts={state?.hearts || 0} maxHearts={maxHearts} />
                  </div>
                  {eliminated && <span className="text-xs">💀</span>}
                </div>
              );
            })}
          </div>

          {/* My hearts in sidebar */}
          {currentPlayer && (
            <div className="p-3 border-t border-border bg-card">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">My Hearts</p>
                <div className="flex justify-center">
                  <HeartsDisplay hearts={myState?.hearts || 0} maxHearts={maxHearts} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Continent selector overlay ── */}
      {isContinent && !continentSubmitted && !isEliminated && !inLocationPhase && (
        <ContinentSelector
          onSelect={handleContinentSelect}
          disabled={continentSubmitted}
          selected={selectedContinent}
          feedback={null}
          countryName={roundState.country}
          phaseStartTime={roundState.phaseStartTime}
          onTimerExpire={handleContinentTimerExpire}
        />
      )}

      {/* Continent feedback overlay */}
      {continentFeedback && !inLocationPhase && (
        <ContinentSelector
          onSelect={() => {}}
          disabled={true}
          selected={selectedContinent}
          feedback={continentFeedback}
          countryName={roundState.country}
          phaseStartTime={roundState.phaseStartTime}
          onTimerExpire={() => {}}
        />
      )}

      {/* ── Confirm modal ── */}
      {showConfirmModal && pendingCountry && (
        <ConfirmModal
          country={pendingCountry}
          onConfirm={handleConfirmCountry}
          onCancel={handleCancelConfirm}
        />
      )}

      {/* ── Round results modal ── */}
      {showResults && roundState.phase === 'results' && (
        <LMSRoundResults
          roundState={roundState}
          players={players}
          lmsStates={lmsStates}
          maxHearts={maxHearts}
          nextRoundIn={Math.ceil(LMS_RESULTS_TIME / 1000)}
        />
      )}
    </div>
  );
};

export default LastManStandingGame;
