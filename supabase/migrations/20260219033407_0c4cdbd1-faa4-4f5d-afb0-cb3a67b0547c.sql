
-- Drop the misconfigured RESTRICTIVE policies on feedback table
-- RESTRICTIVE policies with 'false' are misleading and scanner-flagged
DROP POLICY IF EXISTS "No select on feedback" ON public.feedback;
DROP POLICY IF EXISTS "No direct insert on feedback" ON public.feedback;
DROP POLICY IF EXISTS "No update on feedback" ON public.feedback;
DROP POLICY IF EXISTS "No delete on feedback" ON public.feedback;

-- Drop misconfigured RESTRICTIVE policies on user_roles table
DROP POLICY IF EXISTS "No direct select on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct insert on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct update on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "No direct delete on user_roles" ON public.user_roles;

-- Drop misconfigured RESTRICTIVE policies on game_history table
DROP POLICY IF EXISTS "Users can view their own game history" ON public.game_history;
DROP POLICY IF EXISTS "Users can insert their own game history" ON public.game_history;
DROP POLICY IF EXISTS "No updates to game history" ON public.game_history;
DROP POLICY IF EXISTS "No deletes from game history" ON public.game_history;

-- ============================================================
-- feedback table: all access goes through Edge Functions (service role).
-- Direct client access is denied by having NO permissive policies.
-- RLS enabled + no permissive policies = default deny-all.
-- ============================================================

-- ============================================================
-- user_roles table: access only via Edge Functions (service role).
-- ============================================================

-- ============================================================
-- game_history table: reads and writes go through Edge Functions.
-- No direct client access needed.
-- ============================================================
