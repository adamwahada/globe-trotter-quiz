import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, importX509, decodeProtectedHeader } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Maximum reasonable score per game (prevents absurd values)
const MAX_SCORE_PER_GAME = 500;
const MAX_COUNTRIES = 250;
const MAX_DURATION_MINUTES = 120;
const MAX_PLAYERS = 20;

interface GameHistoryEntry {
  user_id: string;
  session_code: string;
  score: number;
  countries_correct: number;
  countries_wrong: number;
  total_turns: number;
  is_winner: boolean;
  player_count: number;
  game_duration_minutes: number;
  is_solo_mode: boolean;
  rank: number;
}

function validateEntry(entry: GameHistoryEntry): string | null {
  if (!entry.user_id || typeof entry.user_id !== 'string') return 'Invalid user_id';
  if (!entry.session_code || typeof entry.session_code !== 'string' || entry.session_code.length > 10) return 'Invalid session_code';
  if (typeof entry.score !== 'number' || entry.score < 0 || entry.score > MAX_SCORE_PER_GAME) return `Score out of range (0-${MAX_SCORE_PER_GAME})`;
  if (typeof entry.countries_correct !== 'number' || entry.countries_correct < 0 || entry.countries_correct > MAX_COUNTRIES) return 'Invalid countries_correct';
  if (typeof entry.countries_wrong !== 'number' || entry.countries_wrong < 0 || entry.countries_wrong > MAX_COUNTRIES) return 'Invalid countries_wrong';
  if (typeof entry.total_turns !== 'number' || entry.total_turns < 0 || entry.total_turns > MAX_COUNTRIES) return 'Invalid total_turns';
  if (typeof entry.is_winner !== 'boolean') return 'Invalid is_winner';
  if (typeof entry.player_count !== 'number' || entry.player_count < 1 || entry.player_count > MAX_PLAYERS) return 'Invalid player_count';
  if (typeof entry.game_duration_minutes !== 'number' || entry.game_duration_minutes < 1 || entry.game_duration_minutes > MAX_DURATION_MINUTES) return 'Invalid game_duration_minutes';
  if (typeof entry.is_solo_mode !== 'boolean') return 'Invalid is_solo_mode';

  // Logical validation: correct + wrong should roughly equal total_turns
  if (entry.countries_correct + entry.countries_wrong > entry.total_turns + 1) {
    return 'Correct + wrong exceeds total turns';
  }

  // Score sanity: max 3 pts per correct guess, 2 per close guess
  // Allow some margin for card effects (double points, etc.)
  const maxPossibleScore = entry.total_turns * 6; // 3 pts * 2 (double points card)
  if (entry.score > maxPossibleScore && entry.total_turns > 0) {
    return `Score ${entry.score} exceeds maximum possible ${maxPossibleScore} for ${entry.total_turns} turns`;
  }

  // Solo mode should have player_count = 1
  if (entry.is_solo_mode && entry.player_count !== 1) {
    return 'Solo mode must have player_count = 1';
  }

  return null;
}

// ============================================================
// FIREBASE AUTH VERIFICATION
// ============================================================

const FIREBASE_PROJECT_ID = 'lovable-quiz-map';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsCacheExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsCacheExpiry) {
    return cachedCerts;
  }
  const response = await fetch(GOOGLE_CERTS_URL);
  const cacheControl = response.headers.get('cache-control');
  const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
  cachedCerts = await response.json();
  certsCacheExpiry = Date.now() + (maxAge ? parseInt(maxAge) * 1000 : 3600000);
  return cachedCerts!;
}

async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  try {
    const header = decodeProtectedHeader(token);
    if (!header.kid) return null;
    const certs = await getGoogleCerts();
    const cert = certs[header.kid];
    if (!cert) return null;
    const publicKey = await importX509(cert, 'RS256');
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    if (!payload.sub) return null;
    return { uid: payload.sub };
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify Firebase authentication
    const authUser = await verifyFirebaseToken(req.headers.get('Authorization'));
    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { entries } = body as { entries: GameHistoryEntry[] };

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid entries array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (entries.length > MAX_PLAYERS) {
      return new Response(
        JSON.stringify({ error: `Too many entries (max ${MAX_PLAYERS})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all entries
    for (const entry of entries) {
      const validationError = validateEntry(entry);
      if (validationError) {
        return new Response(
          JSON.stringify({ error: `Validation failed: ${validationError}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Filter to only the authenticated user's entries (ignore others silently)
    const userEntries = entries.filter(e => e.user_id === authUser.uid);
    if (userEntries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No entries for authenticated user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // All entries must share the same session_code
    const sessionCode = userEntries[0].session_code;
    if (!userEntries.every(e => e.session_code === sessionCode)) {
      return new Response(
        JSON.stringify({ error: 'All entries must share the same session_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate: same user + same session_code
    const { data: existing, error: checkError } = await supabase
      .from('game_history')
      .select('id')
      .eq('session_code', sessionCode)
      .eq('user_id', authUser.uid)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing entries:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error checking duplicates' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Game history for this session already exists', duplicate: true }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert only the authenticated user's entries
    const { error: insertError } = await supabase
      .from('game_history')
      .insert(userEntries);

    if (insertError) {
      console.error('Error inserting game history:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save game history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, count: entries.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('save-game-history error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
