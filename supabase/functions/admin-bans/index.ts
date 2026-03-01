import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jwtVerify, importX509, decodeProtectedHeader } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIREBASE_PROJECT_ID = 'lovable-quiz-map';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts: Record<string, string> | null = null;
let certsCacheExpiry = 0;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (cachedCerts && Date.now() < certsCacheExpiry) return cachedCerts;
  const response = await fetch(GOOGLE_CERTS_URL);
  const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1];
  cachedCerts = await response.json();
  certsCacheExpiry = Date.now() + (maxAge ? parseInt(maxAge) * 1000 : 3600000);
  return cachedCerts!;
}

async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string; email?: string } | null> {
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
    return { uid: payload.sub, email: payload.email as string | undefined };
  } catch {
    return null;
  }
}

// Verify requester is admin
async function verifyAdmin(supabase: any, uid: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', uid)
    .eq('role', 'admin')
    .maybeSingle();
  return !error && data?.role === 'admin';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const authHeader = req.headers.get('Authorization');

    // check-ban action is public (no admin required) - used by client to check if user is banned
    if (action === 'check-ban') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const now = new Date().toISOString();
      const { data: bans } = await supabase
        .from('bans')
        .select('ban_type, expires_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('banned_at', { ascending: false })
        .limit(1);

      const ban = bans?.[0] || null;
      const sanitizedBan = ban ? { ban_type: ban.ban_type, expires_at: ban.expires_at } : null;
      return new Response(JSON.stringify({ ban: sanitizedBan }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All other actions require admin
    const decoded = await verifyFirebaseToken(authHeader);
    if (!decoded) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const isAdmin = await verifyAdmin(supabase, decoded.uid);
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (action === 'list-bans') {
      const showAll = url.searchParams.get('show_all') === 'true';
      let query = supabase.from('bans').select('*').order('banned_at', { ascending: false });
      if (!showAll) {
        const now = new Date().toISOString();
        query = query.eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ bans: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'ban' && req.method === 'POST') {
      const body = await req.json();
      const { user_id, user_name, user_email, ban_type, reason } = body;

      if (!user_id || !user_name || !ban_type) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const validTypes = ['1day', '3days', '7days', 'permanent'];
      if (!validTypes.includes(ban_type)) {
        return new Response(JSON.stringify({ error: 'Invalid ban type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await supabase.from('bans').update({ is_active: false }).eq('user_id', user_id).eq('is_active', true);

      let expires_at: string | null = null;
      const now = new Date();
      if (ban_type === '1day') { now.setDate(now.getDate() + 1); expires_at = now.toISOString(); }
      else if (ban_type === '3days') { now.setDate(now.getDate() + 3); expires_at = now.toISOString(); }
      else if (ban_type === '7days') { now.setDate(now.getDate() + 7); expires_at = now.toISOString(); }

      const { data, error } = await supabase.from('bans').insert({
        user_id,
        user_name,
        user_email: user_email || null,
        ban_type,
        reason: reason || null,
        expires_at,
        banned_by: decoded.uid,
        is_active: true,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ ban: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'unban' && req.method === 'POST') {
      const body = await req.json();
      const { user_id } = body;
      if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { error } = await supabase.from('bans').update({ is_active: false }).eq('user_id', user_id).eq('is_active', true);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get full ban history for a specific user
    if (action === 'user-ban-history') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const { data, error } = await supabase
        .from('bans')
        .select('*')
        .eq('user_id', userId)
        .order('banned_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ history: data || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[admin-bans] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
