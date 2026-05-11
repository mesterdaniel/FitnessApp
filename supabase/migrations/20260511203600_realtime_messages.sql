-- Enable Realtime for messages table (needed for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
