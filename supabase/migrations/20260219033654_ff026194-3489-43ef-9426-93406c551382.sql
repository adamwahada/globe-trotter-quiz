
-- Add explicit deny-all SELECT policies to feedback and user_roles tables.
-- This makes the intent unambiguous to security scanners:
-- direct client reads are forbidden; all access goes through Edge Functions (service role bypasses RLS).

-- feedback: no direct reads allowed
CREATE POLICY "Deny direct SELECT on feedback"
  ON public.feedback
  FOR SELECT
  USING (false);

-- user_roles: no direct reads allowed
CREATE POLICY "Deny direct SELECT on user_roles"
  ON public.user_roles
  FOR SELECT
  USING (false);

-- game_history: no direct reads allowed
CREATE POLICY "Deny direct SELECT on game_history"
  ON public.game_history
  FOR SELECT
  USING (false);

-- Also add explicit deny for INSERT/UPDATE/DELETE on all three tables
-- to remove any ambiguity

-- feedback
CREATE POLICY "Deny direct INSERT on feedback"
  ON public.feedback
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct UPDATE on feedback"
  ON public.feedback
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct DELETE on feedback"
  ON public.feedback
  FOR DELETE
  USING (false);

-- user_roles
CREATE POLICY "Deny direct INSERT on user_roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct UPDATE on user_roles"
  ON public.user_roles
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct DELETE on user_roles"
  ON public.user_roles
  FOR DELETE
  USING (false);

-- game_history
CREATE POLICY "Deny direct INSERT on game_history"
  ON public.game_history
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct UPDATE on game_history"
  ON public.game_history
  FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct DELETE on game_history"
  ON public.game_history
  FOR DELETE
  USING (false);
