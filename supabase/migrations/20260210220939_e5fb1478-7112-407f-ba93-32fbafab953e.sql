
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "No select on feedback" ON public.feedback
  FOR SELECT USING (false);

CREATE POLICY "No update on feedback" ON public.feedback
  FOR UPDATE USING (false);

CREATE POLICY "No delete on feedback" ON public.feedback
  FOR DELETE USING (false);
