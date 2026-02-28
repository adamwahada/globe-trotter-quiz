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
  const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1];
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
  } catch {
    return null;
  }
}

async function verifyAdmin(supabase: any, uid: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', uid)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authUser = await verifyFirebaseToken(req.headers.get('Authorization'));
    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const isAdmin = await verifyAdmin(supabase, authUser.uid);
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'user-stats') {
      const { data: allUsers } = await supabase
        .from('game_history')
        .select('user_id, created_at');

      const uniqueUsers = new Set((allUsers || []).map((r: any) => r.user_id));
      const totalUsers = uniqueUsers.size;

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const usersLast7Days = new Set(
        (allUsers || [])
          .filter((r: any) => new Date(r.created_at) >= sevenDaysAgo)
          .map((r: any) => r.user_id)
      ).size;

      const usersLastDay = new Set(
        (allUsers || [])
          .filter((r: any) => new Date(r.created_at) >= oneDayAgo)
          .map((r: any) => r.user_id)
      ).size;

      const totalGames = (allUsers || []).length;

      return new Response(JSON.stringify({
        totalUsers,
        usersLast7Days,
        usersLastDay,
        totalGames,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'feedbacks') {
      const page = parseInt(url.searchParams.get('page') || '0');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

      const { data: feedbacks, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { count } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true });

      const { data: avgData } = await supabase
        .from('feedback')
        .select('rating');
      
      const ratings = (avgData || []).map((r: any) => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
        : 0;

      return new Response(JSON.stringify({
        feedbacks: feedbacks || [],
        total: count || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        page,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'feedback-stats') {
      // Fetch all feedbacks for stats computation
      const { data: allFeedbacks, error } = await supabase
        .from('feedback')
        .select('id, rating, created_at')
        .order('created_at', { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const feedbacks = allFeedbacks || [];
      const total = feedbacks.length;
      const avgRating = total > 0
        ? Math.round((feedbacks.reduce((sum: number, f: any) => sum + f.rating, 0) / total) * 10) / 10
        : 0;

      // Distribution
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const f of feedbacks) {
        distribution[f.rating] = (distribution[f.rating] || 0) + 1;
      }

      // Build time-series data (group by day)
      const dailyMap: Record<string, { count: number; totalRating: number }> = {};
      for (const f of feedbacks) {
        const day = f.created_at.substring(0, 10); // YYYY-MM-DD
        if (!dailyMap[day]) dailyMap[day] = { count: 0, totalRating: 0 };
        dailyMap[day].count++;
        dailyMap[day].totalRating += f.rating;
      }

      const timeSeries = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { count, totalRating }]) => ({
          date,
          count,
          avgRating: Math.round((totalRating / count) * 10) / 10,
        }));

      return new Response(JSON.stringify({
        total,
        avgRating,
        distribution,
        timeSeries,
      }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'user-feedback-history') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: history, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ history: history || [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search-users') {
      const query = (url.searchParams.get('q') || '').trim().toLowerCase();
      if (!query || query.length < 2) {
        return new Response(JSON.stringify({ users: [] }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Gather user info from game_history and feedback tables
      const [ghRes, fbRes, bansRes] = await Promise.all([
        supabase.from('game_history').select('user_id'),
        supabase.from('feedback').select('user_id, username, email'),
        supabase.from('bans').select('user_id, user_name, user_email, ban_type, expires_at, is_active, banned_at').eq('is_active', true),
      ]);

      // Build a map of user_id -> { name, email }
      const userMap: Record<string, { name: string; email: string | null }> = {};

      // From feedback (has username & email)
      for (const row of (fbRes.data || [])) {
        if (!userMap[row.user_id]) {
          userMap[row.user_id] = { name: row.username || row.user_id, email: row.email || null };
        } else {
          if (row.username && userMap[row.user_id].name === row.user_id) userMap[row.user_id].name = row.username;
          if (row.email && !userMap[row.user_id].email) userMap[row.user_id].email = row.email;
        }
      }

      // From bans (has user_name & user_email)
      for (const row of (bansRes.data || [])) {
        if (!userMap[row.user_id]) {
          userMap[row.user_id] = { name: row.user_name, email: row.user_email || null };
        } else {
          if (row.user_name && userMap[row.user_id].name === row.user_id) userMap[row.user_id].name = row.user_name;
          if (row.user_email && !userMap[row.user_id].email) userMap[row.user_id].email = row.user_email;
        }
      }

      // From game_history (only user_id)
      for (const row of (ghRes.data || [])) {
        if (!userMap[row.user_id]) {
          userMap[row.user_id] = { name: row.user_id, email: null };
        }
      }

      // Build active bans lookup
      const now = new Date();
      const activeBans: Record<string, { ban_type: string; expires_at: string | null }> = {};
      for (const b of (bansRes.data || [])) {
        if (b.is_active && (!b.expires_at || new Date(b.expires_at) > now)) {
          activeBans[b.user_id] = { ban_type: b.ban_type, expires_at: b.expires_at };
        }
      }

      // Filter by query
      const results = Object.entries(userMap)
        .filter(([uid, info]) =>
          uid.toLowerCase().includes(query) ||
          info.name.toLowerCase().includes(query) ||
          (info.email || '').toLowerCase().includes(query)
        )
        .slice(0, 20)
        .map(([uid, info]) => ({
          user_id: uid,
          name: info.name,
          email: info.email,
          active_ban: activeBans[uid] || null,
        }));

      return new Response(JSON.stringify({ users: results }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
