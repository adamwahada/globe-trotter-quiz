import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify Firebase ID token
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const projectId = Deno.env.get('VITE_FIREBASE_PROJECT_ID');
    if (!projectId) return null;
    const res = await fetch(
      `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`
    );
    const keys = await res.json();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.aud !== projectId) return null;
    if (payload.exp < Date.now() / 1000) return null;
    return { uid: payload.sub, email: payload.email };
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
    const token = authHeader?.replace('Bearer ', '');

    // check-ban action is public (no admin required) - used by client to check if user is banned
    if (action === 'check-ban') {
      const userId = url.searchParams.get('user_id');
      if (!userId) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // Check for active bans
      const now = new Date().toISOString();
      const { data: bans } = await supabase
        .from('bans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('banned_at', { ascending: false })
        .limit(1);

      const ban = bans?.[0] || null;
      return new Response(JSON.stringify({ ban }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All other actions require admin
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const decoded = await verifyFirebaseToken(token);
    if (!decoded) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

      // Deactivate previous bans for this user
      await supabase.from('bans').update({ is_active: false }).eq('user_id', user_id).eq('is_active', true);

      // Calculate expiry
      let expires_at: string | null = null;
      const now = new Date();
      if (ban_type === '1day') { now.setDate(now.getDate() + 1); expires_at = now.toISOString(); }
      else if (ban_type === '3days') { now.setDate(now.getDate() + 3); expires_at = now.toISOString(); }
      else if (ban_type === '7days') { now.setDate(now.getDate() + 7); expires_at = now.toISOString(); }
      // permanent: expires_at stays null

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

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[admin-bans] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
