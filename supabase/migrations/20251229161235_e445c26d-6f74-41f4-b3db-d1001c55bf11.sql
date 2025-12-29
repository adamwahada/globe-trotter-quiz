-- Create game_history table to track all game participations
CREATE TABLE public.game_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_code TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  countries_correct INTEGER NOT NULL DEFAULT 0,
  countries_wrong INTEGER NOT NULL DEFAULT 0,
  total_turns INTEGER NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  player_count INTEGER NOT NULL DEFAULT 1,
  game_duration_minutes INTEGER NOT NULL DEFAULT 5,
  is_solo_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own game history
CREATE POLICY "Users can view their own game history" 
ON public.game_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own game history
CREATE POLICY "Users can insert their own game history" 
ON public.game_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX idx_game_history_created_at ON public.game_history(created_at DESC);