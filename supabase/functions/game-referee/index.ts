import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { verifyFirebaseToken } from '../_shared/firebaseAuth.ts';
import {
  assertPlayerInSession,
  fetchSession,
  resolveLmsRound,
  resolveSpeedRaceCountry,
} from '../_shared/firebaseSession.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SPEED_RACE_ANSWER_TIME = 20;
const SPEED_RACE_MAX_POINTS = 5;

function calculateSpeedRacePoints(elapsedMs: number): number {
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  const fraction = Math.min(1, elapsedSec / SPEED_RACE_ANSWER_TIME);
  const raw = SPEED_RACE_MAX_POINTS * (1 - fraction * 0.8);
  return Math.round(raw * 100) / 100;
}

function calculateHeartLoss(continentCorrect: boolean, countryCorrect: boolean): number {
  if (continentCorrect && countryCorrect) return 0;
  if (continentCorrect || countryCorrect) return 0.5;
  return 1;
}

function normalizeCountry(name: string): string {
  return name.trim().toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const authUser = await verifyFirebaseToken(authHeader);
    if (!authUser) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const body = await req.json();
    const { action, sessionCode, playerId } = body;

    if (!action || !sessionCode || !playerId) {
      return json({ error: 'Missing action, sessionCode, or playerId' }, 400);
    }

    const session = await fetchSession(sessionCode, authUser.token);
    if (!session) {
      return json({ error: 'Session not found' }, 404);
    }
    if (!assertPlayerInSession(session, playerId, authUser.uid)) {
      return json({ error: 'Not a member of this session' }, 403);
    }
    if (session.status !== 'playing') {
      return json({ error: 'Session is not in playing state' }, 409);
    }

    switch (action) {
      case 'speed_race_confirm': {
        const { clickedCountry, confirmedAt } = body;
        if (!clickedCountry || typeof confirmedAt !== 'number') {
          return json({ error: 'Missing clickedCountry or confirmedAt' }, 400);
        }
        const answerKey = resolveSpeedRaceCountry(session, playerId);
        if (!answerKey) {
          return json({ error: 'Not accepting submissions for this round' }, 409);
        }
        const isCorrect = normalizeCountry(clickedCountry) === normalizeCountry(answerKey);
        const phaseStart = session.speedRaceRoundState?.phaseStartTime ?? confirmedAt;
        const elapsedMs = Math.max(0, confirmedAt - phaseStart);
        const pointsEarned = isCorrect ? calculateSpeedRacePoints(elapsedMs) : 0;
        return json({
          isCorrect,
          pointsEarned,
          answerKey,
          elapsedMs,
        });
      }

      case 'lms_continent': {
        const { continent } = body;
        if (!continent || typeof continent !== 'string') {
          return json({ error: 'Missing continent' }, 400);
        }
        const rs = resolveLmsRound(session);
        if (!rs || rs.phase !== 'continent') {
          return json({ error: 'Continent phase not active' }, 409);
        }
        const isCorrect = continent === rs.correctContinent;
        return json({
          isCorrect,
          correctContinent: rs.correctContinent,
          heartLoss: calculateHeartLoss(isCorrect, false),
        });
      }

      case 'lms_country': {
        const { country, continentCorrect } = body;
        if (!country || typeof country !== 'string') {
          return json({ error: 'Missing country' }, 400);
        }
        const rs = resolveLmsRound(session);
        if (!rs || (rs.phase !== 'location' && rs.phase !== 'continent')) {
          return json({ error: 'Country confirmation not active' }, 409);
        }
        const isCountryCorrect = normalizeCountry(country) === normalizeCountry(rs.country);
        const isContinentCorrect = Boolean(continentCorrect);
        const heartLoss = calculateHeartLoss(isContinentCorrect, isCountryCorrect);
        return json({
          isCorrect: isCountryCorrect,
          isContinentCorrect,
          answerKey: rs.country,
          heartLoss,
        });
      }

      case 'map_click_validate': {
        const { clickedCountry, mode } = body;
        if (!clickedCountry) {
          return json({ error: 'Missing clickedCountry' }, 400);
        }
        let answerKey: string | null = null;
        if (mode === 'speed_race') {
          answerKey = resolveSpeedRaceCountry(session, playerId);
        } else if (mode === 'turn') {
          answerKey = session.currentTurnState?.country ?? null;
        }
        if (!answerKey) {
          return json({ error: 'No active target country' }, 409);
        }
        const isCorrect = normalizeCountry(clickedCountry) === normalizeCountry(answerKey);
        return json({ isCorrect, answerKey });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (error) {
    console.error('game-referee error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
