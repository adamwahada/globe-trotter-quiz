
-- Lock down usernames table writes: only service_role (via secure edge function that
-- verifies Firebase ID token) may INSERT/UPDATE. SELECT remains public since usernames
-- are non-sensitive display data required for uniqueness checks.

DROP POLICY IF EXISTS "Users can insert own username" ON public.usernames;
DROP POLICY IF EXISTS "Users can update own username" ON public.usernames;

-- Explicitly deny INSERT/UPDATE/DELETE from anon and authenticated (RLS with no
-- matching policy already denies; these no-op policies document intent).
CREATE POLICY "Deny client inserts on usernames"
  ON public.usernames FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on usernames"
  ON public.usernames FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny client deletes on usernames"
  ON public.usernames FOR DELETE TO anon, authenticated
  USING (false);
