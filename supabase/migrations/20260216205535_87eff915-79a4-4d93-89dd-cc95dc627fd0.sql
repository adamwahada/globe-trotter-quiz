-- Drop RLS policies that depend on user_id
DROP POLICY IF EXISTS "Users can view their own game history" ON public.game_history;
DROP POLICY IF EXISTS "Users can insert their own game history" ON public.game_history;

-- Change user_id from uuid to text for Firebase UID compatibility
ALTER TABLE public.game_history ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate RLS policies (these won't match Firebase users via auth.uid(),
-- but edge functions use service_role which bypasses RLS)
CREATE POLICY "Users can view their own game history"
ON public.game_history FOR SELECT
USING (false);

CREATE POLICY "Users can insert their own game history"
ON public.game_history FOR INSERT
WITH CHECK (false);
