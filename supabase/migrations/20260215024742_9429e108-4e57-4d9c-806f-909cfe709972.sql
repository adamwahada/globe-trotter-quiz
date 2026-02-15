
-- Add rank column to game_history
ALTER TABLE public.game_history ADD COLUMN rank integer NOT NULL DEFAULT 0;
