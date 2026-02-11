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

async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string; displayName?: string } | null> {
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
    return { uid: payload.sub, displayName: (payload as any).name || undefined };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Firebase authentication
    const authUser = await verifyFirebaseToken(req.headers.get('Authorization'));
    if (!authUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { rating, comment } = body;

    // Validate rating
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating must be an integer between 1 and 5' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate comment
    const sanitizedComment = typeof comment === 'string' ? comment.trim().slice(0, 500) : null;

    // Insert using service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error } = await supabase.from('feedback').insert({
      user_id: authUser.uid,
      username: authUser.displayName || null,
      rating,
      comment: sanitizedComment || null,
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return new Response(JSON.stringify({ error: 'Failed to save feedback' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('submit-feedback error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
