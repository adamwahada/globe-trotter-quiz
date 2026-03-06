
CREATE TABLE public.usernames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.usernames ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read usernames" ON public.usernames
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own username" ON public.usernames
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own username" ON public.usernames
  FOR UPDATE USING (true);
