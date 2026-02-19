import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { WorldMap } from '@/components/Map/WorldMap';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { playersMapToArray } from '@/types/game';
import {
  SPEED_RACE_ANSWER_TIME,
  SPEED_RACE_REVEAL_TIME,
  SPEED_RACE_COUNTDOWN_TIME,
  SPEED_RACE_RESULTS_TIME,
  calculateSpeedRacePoints,
  SpeedRaceRoundState,
} from '@/types/game';
import { getRandomUnplayedCountry, getCountryFlag } from '@/utils/countryData';
import { LogOut, Trophy, MapPin, CheckCircle, XCircle, Zap } from 'lucide-react';
import { removePlayerFromSession, clearRecoveryData } from '@/services/gameSessionService';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Animated countdown overlay (3…2…1) before each round's map reveal */
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-xl">
      <div className="text-center animate-fade-in">
        <p className="text-xl text-muted-foreground mb-6 font-display">Map reveals in...</p>
        <div className="text-[10rem] font-display text-success drop-shadow-[0_0_60px_hsl(var(--success))]">
          {count || '🗺️'}
        </div>
      </div>
    </div>
  );
};

/** Timer bar that depletes over SPEED_RACE_ANSWER_TIME seconds */
const RoundTimer: React.FC<{ startTime: number; onExpire: () => void }> = ({ startTime, onExpire }) => {
  const [pct, setPct] = useState(100);
  const [elapsed, setElapsed] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const iv = setInterval(() => {
      const e = (Date.now() - startTime) / 1000;
      const p = Math.max(0, 100 - (e / SPEED_RACE_ANSWER_TIME) * 100);
      setPct(p);
      setElapsed(e);
      if (p <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    }, 100);
    return () => clearInterval(iv);
  }, [startTime, onExpire]);

  const remaining = Math.max(0, SPEED_RACE_ANSWER_TIME - elapsed);
  const color =
    pct > 60
      ? 'hsl(var(--success))'
      : pct > 30
        ? 'hsl(var(--warning))'
        : 'hsl(var(--destructive))';

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Time left</span>
        <span style={{ color }} className="font-bold tabular-nums">
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

/** Post-round results modal: Top 10 ranking with rank movement & points earned */
const RoundResultsModal: React.FC<{
  roundState: SpeedRaceRoundState;
  players: ReturnType<typeof playersMapToArray>;
  prevRanking: { id: string; score: number }[];
  nextRoundIn: number;
}> = ({ roundState, players, prevRanking, nextRoundIn }) => {
  const { t } = useLanguage();
  const [countdown, setCountdown] = useState(nextRoundIn);

  useEffect(() => {
    setCountdown(nextRoundIn);
    const iv = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(iv);
  }, [nextRoundIn, roundState.roundNumber]);

  // Build current ranking sorted by score
  const ranked = [...players].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-success/20 to-success/5 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display text-foreground">{t('roundResults' as any)}</h2>
              <p className="text-sm text-muted-foreground">
                {t('round' as any)} {roundState.roundNumber} — {t('correct2' as any)}: <span className="font-bold text-foreground">{roundState.country}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getCountryFlag(roundState.country)}</span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {ranked.map((player, idx) => {
            const submission = roundState.submissions?.[player.id];
            const pts = submission?.pointsEarned ?? 0;
            const wasCorrect = submission?.isCorrect ?? false;
            const prevPos = prevRanking.findIndex(r => r.id === player.id);
            const rankChange = prevPos === -1 ? 0 : prevPos - idx;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  idx === 0
                    ? 'border-yellow-500/40 bg-yellow-500/10'
                    : idx === 1
                      ? 'border-gray-400/40 bg-gray-400/10'
                      : idx === 2
                        ? 'border-amber-600/40 bg-amber-600/10'
                        : 'border-border bg-secondary/30'
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center font-bold text-lg">
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>

                {/* Name + rank change */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{player.username}</p>
                  {rankChange !== 0 && (
                    <p
                      className={`text-xs font-bold ${
                        rankChange > 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {rankChange > 0 ? `↑ ${rankChange}` : `↓ ${Math.abs(rankChange)}`}
                    </p>
                  )}
                </div>

                {/* This round result */}
                <div className="text-right shrink-0">
                  {submission ? (
                    <div className="flex items-center gap-1.5">
                      {wasCorrect ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span
                        className={`text-sm font-bold ${
                          wasCorrect ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        {wasCorrect ? `+${pts.toFixed(2)}` : '0'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <p className="text-xs text-muted-foreground">{player.score.toFixed(2)} total</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t('nextRoundIn' as any)}{' '}
            <span className="font-bold text-foreground">{countdown}s</span>
          </p>
        </div>
      </div>
    </div>
  );
};

/** Animated Kahoot-style podium for the final results */
const SpeedRacePodium: React.FC<{
  players: ReturnType<typeof playersMapToArray>;
  onBack: () => void;
}> = ({ players, onBack }) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Podium visual order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const heights = ['h-28', 'h-40', 'h-20'];
  const podiumIdx = [1, 0, 2]; // which rank each position represents

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/98 backdrop-blur-xl p-4 overflow-y-auto">
      {/* Stars background */}
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
            ⭐
          </div>
        ))}
      </div>

      <div
        className={`relative w-full max-w-lg transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-warning animate-bounce" />
            <h1 className="text-4xl font-display text-foreground">{t('podiumTitle' as any)}</h1>
            <Trophy
              className="h-8 w-8 text-warning animate-bounce"
              style={{ animationDelay: '0.2s' }}
            />
          </div>
          <p className="text-muted-foreground">{t('podiumSubtitle' as any)}</p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-8">
          {podiumOrder.map((player, pos) => {
            if (!player) return <div key={pos} className="w-28" />;
            const rank = podiumIdx[pos];
            const rankEmoji = rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉';
            const podiumH = heights[pos];

            return (
              <div
                key={player.id}
                className={`flex flex-col items-center transition-all duration-700 ${
                  visible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${pos * 200}ms` }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 border-4 border-background shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>
                <p className="text-sm font-bold text-foreground mb-1 text-center max-w-[5rem] truncate">
                  {player.username}
                </p>
                <p className="text-xs text-muted-foreground mb-2">{player.score.toFixed(2)} pts</p>
                <div className="text-2xl mb-1">{rankEmoji}</div>

                {/* Podium block */}
                <div
                  className={`${podiumH} w-24 rounded-t-lg flex items-start justify-center pt-2 font-display text-2xl`}
                  style={{
                    background:
                      rank === 0
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : rank === 1
                          ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)'
                          : 'linear-gradient(135deg, #CD7F32, #A0522D)',
                  }}
                >
                  {rank + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of players */}
        {rest.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
            {rest.map((player, i) => (
              <div key={player.id} className="flex items-center gap-3">
                <span className="w-8 text-center text-muted-foreground font-bold">#{i + 4}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>
                <span className="flex-1 text-sm text-foreground">{player.username}</span>
                <span className="text-sm font-bold text-foreground">{player.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <Button variant="netflix" className="w-full" onClick={onBack}>
          {t('backToHome')}
        </Button>
      </div>
    </div>
  );
};

// ─── Main SpeedRaceGame ────────────────────────────────────────────────────────

const SpeedRaceGame: React.FC = () => {
  const { t } = useLanguage();
  const { session, currentPlayer, updateGameState, endGame, getPlayersArray } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound } = useSound();
  const navigate = useNavigate();

  const players = getPlayersArray ? getPlayersArray() : playersMapToArray(session?.players);
  const isHost = session?.host === currentPlayer?.id;

  const roundState = session?.speedRaceRoundState as SpeedRaceRoundState | null | undefined;
  const totalRounds = session?.totalRounds || 20;
  const currentRound = session?.currentRound || 0;
  const guessedCountries = session?.guessedCountries || [];

  // Local UI state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  // prevRanking is computed from session data so all players share it
  const prevRankingRef = useRef<{ id: string; score: number }[]>([]);

  // Refs to avoid stale closures in async host effects
  const sessionRef = useRef(session);
  const roundStateRef = useRef(roundState);
  const playersRef = useRef(players);
  const isHostRef = useRef(isHost);
  const currentRoundRef = useRef(currentRound);
  const totalRoundsRef = useRef(totalRounds);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { roundStateRef.current = roundState; }, [roundState]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { currentRoundRef.current = currentRound; }, [currentRound]);
  useEffect(() => { totalRoundsRef.current = totalRounds; }, [totalRounds]);

  // Guard refs
  const submittedRoundRef = useRef<number>(-1);
  const timeoutFiredRef = useRef<number>(-1);
  const orchestratorRoundRef = useRef<number>(-1); // prevent double-firing per round+phase

  // When round state changes phase, reset local selection
  useEffect(() => {
    if (roundState?.phase === 'guessing') {
      setSelectedCountry(null);
      setHasSubmitted(false);
    }
    if (roundState?.phase === 'results') {
      setShowResults(true);
    }
    // Hide results modal when next round starts
    if (roundState?.phase === 'reveal') {
      setShowResults(false);
    }
  }, [roundState?.phase, roundState?.roundNumber]);

  // ── HOST: moveToResults ───────────────────────────────────────────────────
  const moveToResults = useCallback(async (rs: SpeedRaceRoundState) => {
    if (!isHostRef.current) return;
    const sess = sessionRef.current;
    if (!sess) return;

    // Save prevRanking snapshot before updating scores
    prevRankingRef.current = Object.entries(sess.players || {})
      .map(([id, p]) => ({ id, score: p.score || 0 }))
      .sort((a, b) => b.score - a.score);

    // Update player scores
    const updatedPlayers = { ...(sess.players || {}) };
    Object.entries(rs.submissions || {}).forEach(([pid, sub]) => {
      if (updatedPlayers[pid] && sub.isCorrect) {
        updatedPlayers[pid] = {
          ...updatedPlayers[pid],
          score: (updatedPlayers[pid].score || 0) + sub.pointsEarned,
        };
      }
    });

    await updateGameState({
      players: updatedPlayers,
      speedRaceRoundState: { ...rs, phase: 'results', phaseStartTime: Date.now() },
    } as any);
  }, [updateGameState]);

  // ── HOST: advanceRound ────────────────────────────────────────────────────
  const advanceRound = useCallback(async () => {
    if (!isHostRef.current) return;
    const sess = sessionRef.current;
    const rs = roundStateRef.current;
    if (!sess) return;

    const nextRound = currentRoundRef.current + 1;

    if (nextRound > totalRoundsRef.current) {
      // Game over — add the last country to guessed list then end
      const allGuessed = [
        ...(sess.guessedCountries || []),
        ...(rs?.country ? [rs.country] : []),
      ];
      await updateGameState({
        guessedCountries: allGuessed,
        speedRaceRoundState: null,
        currentRound: nextRound,
      } as any);
      await endGame();
      return;
    }

    // Pick next country
    const allGuessed = [
      ...(sess.guessedCountries || []),
      ...(rs?.country ? [rs.country] : []),
    ];
    const nextCountry = getRandomUnplayedCountry(allGuessed);
    if (!nextCountry) {
      await endGame();
      return;
    }

    const newRoundState: SpeedRaceRoundState = {
      roundNumber: nextRound,
      country: nextCountry,
      phase: 'reveal',
      phaseStartTime: Date.now(),
      submissions: {},
    };

    await updateGameState({
      currentRound: nextRound,
      guessedCountries: allGuessed,
      speedRaceRoundState: newRoundState,
    } as any);
  }, [updateGameState, endGame]);

  // ── HOST: Orchestrate round phases ────────────────────────────────────────
  useEffect(() => {
    if (!isHost || !roundState) return;

    const phase = roundState.phase;
    const roundNum = roundState.roundNumber;
    const phaseKey = `${roundNum}-${phase}`;

    // Prevent re-firing the same phase transition
    if (orchestratorRoundRef.current === phaseKey.length && phase !== 'guessing') return;

    if (phase === 'reveal') {
      const elapsed = Date.now() - roundState.phaseStartTime;
      const delay = Math.max(0, SPEED_RACE_REVEAL_TIME - elapsed);
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        await updateGameState({
          speedRaceRoundState: {
            ...roundStateRef.current!,
            phase: 'countdown',
            phaseStartTime: Date.now(),
          },
        } as any);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'countdown') {
      const elapsed = Date.now() - roundState.phaseStartTime;
      const delay = Math.max(0, SPEED_RACE_COUNTDOWN_TIME - elapsed);
      const tid = setTimeout(async () => {
        if (!isHostRef.current) return;
        await updateGameState({
          speedRaceRoundState: {
            ...roundStateRef.current!,
            phase: 'guessing',
            phaseStartTime: Date.now(),
          },
        } as any);
      }, delay);
      return () => clearTimeout(tid);
    }

    if (phase === 'guessing') {
      // Poll every 500ms to check if all players submitted or timer expired
      const iv = setInterval(async () => {
        const rs = roundStateRef.current;
        if (!rs || rs.phase !== 'guessing') { clearInterval(iv); return; }
        const subs = rs.submissions || {};
        const allSubmitted = playersRef.current.every(p => subs[p.id] !== undefined);
        if (allSubmitted) {
          clearInterval(iv);
          await moveToResults(rs);
        }
      }, 500);
      return () => clearInterval(iv);
    }

    if (phase === 'results') {
      const elapsed = Date.now() - roundState.phaseStartTime;
      const delay = Math.max(0, SPEED_RACE_RESULTS_TIME - elapsed);
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

    const firstCountry = getRandomUnplayedCountry([]);
    if (!firstCountry) return;

    const initRound: SpeedRaceRoundState = {
      roundNumber: 1,
      country: firstCountry,
      phase: 'reveal',
      phaseStartTime: Date.now(),
      submissions: {},
    };

    updateGameState({
      currentRound: 1,
      speedRaceRoundState: initRound,
    } as any);
  }, [session?.status, isHost]);

  // ── Show podium when session finishes (all players) ───────────────────────
  useEffect(() => {
    if (session?.status === 'finished') {
      setShowPodium(true);
    }
  }, [session?.status]);

  // ── Handle map click (country selection) ──────────────────────────────────
  const handleCountryClick = useCallback((country: string) => {
    if (hasSubmitted || roundState?.phase !== 'guessing') return;
    if (roundState?.submissions?.[currentPlayer?.id || '']) return;
    setSelectedCountry(country);
  }, [hasSubmitted, roundState, currentPlayer]);

  // ── Confirm submission ────────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!currentPlayer || !roundState || hasSubmitted) return;
    if (roundState.phase !== 'guessing') return;
    if (roundState.submissions?.[currentPlayer.id]) return;
    if (submittedRoundRef.current === roundState.roundNumber) return;

    const confirmedAt = Date.now();
    const elapsedMs = confirmedAt - roundState.phaseStartTime;
    const isCorrect = selectedCountry === roundState.country;
    const pointsEarned = isCorrect ? calculateSpeedRacePoints(elapsedMs) : 0;

    setHasSubmitted(true);
    submittedRoundRef.current = roundState.roundNumber;

    const updatedSubs = {
      ...(roundState.submissions || {}),
      [currentPlayer.id]: {
        clickedCountry: selectedCountry,
        confirmedAt,
        isCorrect,
        pointsEarned,
      },
    };

    await updateGameState({
      speedRaceRoundState: { ...roundState, submissions: updatedSubs },
    } as any);

    if (isCorrect) {
      addToast('success', `✓ Correct! +${pointsEarned.toFixed(2)} pts`);
      playToastSound('success');
    } else {
      addToast('error', `✗ Wrong — it was ${roundState.country}`);
      playToastSound('error');
    }
  }, [currentPlayer, roundState, hasSubmitted, selectedCountry, updateGameState, addToast, playToastSound]);

  // ── Timer expire: auto-submit empty ───────────────────────────────────────
  const handleTimerExpire = useCallback(async () => {
    if (!currentPlayer || !roundState || hasSubmitted) return;
    if (roundState.phase !== 'guessing') return;
    if (roundState.submissions?.[currentPlayer.id]) return;
    if (timeoutFiredRef.current === roundState.roundNumber) return;
    timeoutFiredRef.current = roundState.roundNumber;

    setHasSubmitted(true);
    const updatedSubs = {
      ...(roundState.submissions || {}),
      [currentPlayer.id]: {
        clickedCountry: null,
        confirmedAt: Date.now(),
        isCorrect: false,
        pointsEarned: 0,
      },
    };

    await updateGameState({
      speedRaceRoundState: { ...roundState, submissions: updatedSubs },
    } as any);
  }, [currentPlayer, roundState, hasSubmitted, updateGameState]);

  // ── Quit ──────────────────────────────────────────────────────────────────
  const handleQuit = async () => {
    if (session && currentPlayer) {
      await removePlayerFromSession(session.code, currentPlayer.id);
    }
    clearRecoveryData();
    navigate('/');
  };

  // ── Podium screen ─────────────────────────────────────────────────────────
  if (showPodium) {
    return <SpeedRacePodium players={players} onBack={() => navigate('/')} />;
  }

  if (!roundState) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <p className="text-muted-foreground">Loading Speed Race...</p>
        </div>
      </div>
    );
  }

  const mySubmission = roundState.submissions?.[currentPlayer?.id || ''];
  const submittedCount = Object.keys(roundState.submissions || {}).length;

  // Build prevRanking from current player scores BEFORE results phase updates them
  // For non-host players we derive it from current session.players scores
  const prevRanking = prevRankingRef.current.length > 0
    ? prevRankingRef.current
    : Object.entries(session?.players || {})
        .map(([id, p]) => ({ id, score: p.score || 0 }))
        .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReconnectionBanner />

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur border-b border-border">
        <Logo />

        <div className="flex items-center gap-3">
          {/* Round counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
            <Zap className="h-4 w-4 text-success" />
            <span className="text-sm font-bold text-foreground">
              {t('round' as any)} {roundState.roundNumber}/{totalRounds}
            </span>
          </div>

          {/* My score */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">
              {(currentPlayer?.score || 0).toFixed(2)}
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={handleQuit} className="gap-2">
            <LogOut className="h-4 w-4" />
            Quit
          </Button>
        </div>
      </header>

      {/* Country reveal bar */}
      <div
        className={`text-center py-4 px-4 border-b border-border transition-all ${
          roundState.phase === 'reveal'
            ? 'bg-success/20'
            : roundState.phase === 'guessing'
              ? 'bg-card'
              : 'bg-secondary/50'
        }`}
      >
        {roundState.phase === 'reveal' || roundState.phase === 'countdown' ? (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              {t('findCountry' as any)}
            </p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground">
              {roundState.country}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{t('mapRevealIn' as any)}</p>
          </>
        ) : roundState.phase === 'guessing' ? (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              {t('findCountry' as any)}
            </p>
            <h2 className="text-3xl md:text-4xl font-display text-foreground">
              {roundState.country}
            </h2>
            {hasSubmitted ? (
              <p className="text-xs text-success mt-1">
                {t('waitingForPlayers2' as any)} ({submittedCount}/{players.length})
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{t('clickToConfirm' as any)}</p>
            )}
          </>
        ) : null}
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Blurred overlay during reveal */}
        {roundState.phase === 'reveal' && (
          <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/60 flex items-center justify-center">
            <div className="text-center">
              <p className="text-6xl mb-4 animate-pulse">🗺️</p>
              <p className="text-xl font-display text-foreground">{roundState.country}</p>
              <p className="text-sm text-muted-foreground mt-2">{t('mapRevealIn' as any)}</p>
            </div>
          </div>
        )}

        {/* 3-second countdown overlay */}
        {roundState.phase === 'countdown' && (
          <RoundCountdown startTime={roundState.phaseStartTime} />
        )}

        <WorldMap
          currentCountry={
            roundState.phase === 'guessing' ? selectedCountry || undefined : undefined
          }
          guessedCountries={guessedCountries}
          correctCountries={session?.correctCountries || []}
          wrongCountries={session?.wrongCountries || []}
          onCountryClick={
            roundState.phase === 'guessing' && !hasSubmitted ? handleCountryClick : () => {}
          }
          disabled={roundState.phase !== 'guessing' || hasSubmitted}
        />

        {/* Bottom action bar: timer + confirm */}
        {roundState.phase === 'guessing' && !hasSubmitted && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur border-t border-border">
            <div className="max-w-lg mx-auto space-y-3">
              <RoundTimer startTime={roundState.phaseStartTime} onExpire={handleTimerExpire} />

              <div className="flex items-center gap-3">
                {selectedCountry ? (
                  <>
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
                      <MapPin className="h-4 w-4 text-success shrink-0" />
                      <span className="text-sm font-medium text-foreground">{selectedCountry}</span>
                    </div>
                    <Button variant="netflix" onClick={handleConfirm} className="gap-2 shrink-0">
                      <CheckCircle className="h-4 w-4" />
                      {t('confirmLocation' as any)}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center w-full">
                    {t('selectLocation' as any)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submitted state */}
        {roundState.phase === 'guessing' && hasSubmitted && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-background/90 backdrop-blur border-t border-border">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mySubmission?.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="text-sm text-foreground">
                  {mySubmission?.isCorrect
                    ? `${t('correct2' as any)} +${mySubmission.pointsEarned.toFixed(2)} pts`
                    : t('incorrect' as any)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {submittedCount}/{players.length} answered
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Round results modal */}
      {showResults && roundState.phase === 'results' && (
        <RoundResultsModal
          roundState={roundState}
          players={players}
          prevRanking={prevRanking}
          nextRoundIn={Math.ceil(SPEED_RACE_RESULTS_TIME / 1000)}
        />
      )}
    </div>
  );
};

export default SpeedRaceGame;
