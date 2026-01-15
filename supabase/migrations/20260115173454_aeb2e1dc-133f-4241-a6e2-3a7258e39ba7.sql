-- Create table for message relay (store-and-forward)
CREATE TABLE public.pending_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_public_key TEXT NOT NULL,
  recipient_public_key TEXT NOT NULL,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,
  signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_attempts INTEGER DEFAULT 0
);

-- Index for fast lookup by recipient
CREATE INDEX idx_pending_messages_recipient ON public.pending_messages(recipient_public_key);
CREATE INDEX idx_pending_messages_expires ON public.pending_messages(expires_at);

-- Enable Row Level Security
ALTER TABLE public.pending_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (anonymous relay)
CREATE POLICY "Anyone can send messages"
ON public.pending_messages
FOR INSERT
WITH CHECK (true);

-- Allow recipients to read their messages
CREATE POLICY "Recipients can read their messages"
ON public.pending_messages
FOR SELECT
USING (true);

-- Allow marking as delivered
CREATE POLICY "Anyone can update delivery status"
ON public.pending_messages
FOR UPDATE
USING (true);

-- Allow cleanup of old messages
CREATE POLICY "Anyone can delete expired or delivered messages"
ON public.pending_messages
FOR DELETE
USING (delivered_at IS NOT NULL OR expires_at < now());

-- Enable realtime for message notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_messages;