import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jwtVerify, importX509, decodeProtectedHeader } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FIREBASE_PROJECT_ID = 'lovable-quiz-map';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsCacheExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsCacheExpiry) return cachedCerts;
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

function validateUsername(name: string): string | null {
  if (typeof name !== 'string') return 'Invalid username';
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 20) return 'Username must be 2-20 characters';
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return 'Username contains invalid characters';
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await verifyFirebaseToken(req.headers.get('Authorization'));
    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const username: string = body?.username ?? '';
    const err = validateUsername(username);
    if (err) {
      return new Response(JSON.stringify({ error: err }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const trimmed = username.trim();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Uniqueness check (case-insensitive) excluding self
    const { data: existing, error: checkErr } = await supabase
      .from('usernames')
      .select('user_id')
      .ilike('username', trimmed)
      .neq('user_id', authUser.uid)
      .limit(1);

    if (checkErr) {
      console.error('username check error:', checkErr);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Username already taken', taken: true }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: upsertErr } = await supabase
      .from('usernames')
      .upsert(
        { user_id: authUser.uid, username: trimmed, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (upsertErr) {
      console.error('username upsert error:', upsertErr);
      return new Response(JSON.stringify({ error: 'Failed to save username' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, username: trimmed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('manage-username error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
