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

function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

  try {
    // GET: list all unique conversations (grouped by sender_id)
    if (req.method === 'GET' && action === 'conversations') {
      // Get all messages grouped by sender_id
      const { data: messages, error } = await supabase
        .from('messages')
        .select('sender_id, sender_name, sender_email, content, is_admin_reply, is_read, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Group by sender_id to build conversation summaries
      const conversationsMap: Record<string, any> = {};
      for (const msg of (messages || [])) {
        if (!conversationsMap[msg.sender_id]) {
          conversationsMap[msg.sender_id] = {
            sender_id: msg.sender_id,
            sender_name: msg.sender_name,
            sender_email: msg.sender_email,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          };
        }
        // Count unread user messages (not admin replies) that admin hasn't read
        if (!msg.is_admin_reply && !msg.is_read) {
          conversationsMap[msg.sender_id].unread_count++;
        }
      }

      const conversations = Object.values(conversationsMap)
        .sort((a: any, b: any) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

      return new Response(JSON.stringify({ conversations }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: get full conversation with a specific user
    if (req.method === 'GET' && action === 'conversation') {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return new Response(JSON.stringify({ error: 'user_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, sender_id, sender_name, content, is_admin_reply, is_read, created_at')
        .eq('sender_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Mark unread user messages as read (admin opened the conversation)
      const unreadIds = (messages || [])
        .filter((m: any) => !m.is_admin_reply && !m.is_read)
        .map((m: any) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }

      return new Response(JSON.stringify({ messages: messages || [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET: count total unread messages (for admin badge)
    if (req.method === 'GET' && action === 'unread-count') {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_admin_reply', false)
        .eq('is_read', false);

      if (error) {
        return new Response(JSON.stringify({ error: 'Database error' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ unreadCount: count || 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: admin replies to a user
    if (req.method === 'POST' && action === 'reply') {
      const body = await req.json();
      const targetUserId = body.target_user_id;
      const targetUserName = sanitize(body.target_user_name || 'User');
      const content = sanitize(body.content || '');

      if (!targetUserId || !content) {
        return new Response(JSON.stringify({ error: 'target_user_id and content required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (content.length > 2000) {
        return new Response(JSON.stringify({ error: 'Reply too long (max 2000 characters)' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
          sender_id: targetUserId, // admin reply is stored under the user's sender_id for grouping
          sender_name: targetUserName,
          content,
          is_admin_reply: true,
          is_read: false, // user hasn't read it yet
        })
        .select('id, sender_id, sender_name, content, is_admin_reply, is_read, created_at')
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to send reply' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: msg }), {
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
