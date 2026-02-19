
-- Create bans table with strict deny-all RLS (service_role only via edge functions)
CREATE TABLE public.bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT,
  reason TEXT,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('1day', '3days', '7days', 'permanent')),
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  banned_by TEXT NOT NULL, -- admin user_id
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

-- Deny-all policies: all access goes through edge functions with service_role key
CREATE POLICY "Deny direct SELECT on bans"
  ON public.bans FOR SELECT USING (false);

CREATE POLICY "Deny direct INSERT on bans"
  ON public.bans FOR INSERT WITH CHECK (false);

CREATE POLICY "Deny direct UPDATE on bans"
  ON public.bans FOR UPDATE USING (false);

CREATE POLICY "Deny direct DELETE on bans"
  ON public.bans FOR DELETE USING (false);

-- Index for fast lookups by user_id + active status
CREATE INDEX idx_bans_user_id_active ON public.bans (user_id, is_active);
CREATE INDEX idx_bans_expires_at ON public.bans (expires_at) WHERE is_active = true;
