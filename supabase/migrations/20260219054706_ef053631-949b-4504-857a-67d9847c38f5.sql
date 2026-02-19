
-- Create messages table for user <-> admin messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  content TEXT NOT NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- DENY ALL direct access — only edge functions with service_role key can access
CREATE POLICY "Deny direct SELECT on messages"
  ON public.messages FOR SELECT
  USING (false);

CREATE POLICY "Deny direct INSERT on messages"
  ON public.messages FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny direct UPDATE on messages"
  ON public.messages FOR UPDATE
  USING (false);

CREATE POLICY "Deny direct DELETE on messages"
  ON public.messages FOR DELETE
  USING (false);

-- Index for efficient queries by sender
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- Enable realtime for live message updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
