-- Deny all UPDATE operations on game_history (scores should be immutable)
CREATE POLICY "No updates to game history"
ON public.game_history
FOR UPDATE
USING (false);

-- Deny all DELETE operations on game_history (history should be permanent)
CREATE POLICY "No deletes from game history"
ON public.game_history
FOR DELETE
USING (false);