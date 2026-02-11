-- Block all direct inserts to feedback table (only edge function with service role can insert)
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "No direct insert on feedback" ON public.feedback
  FOR INSERT
  WITH CHECK (false);