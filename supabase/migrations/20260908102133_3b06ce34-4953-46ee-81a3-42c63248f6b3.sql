CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages TO authenticated;
GRANT ALL ON public.group_messages TO service_role;

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read group messages"
  ON public.group_messages FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can send group messages"
  ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Authors can delete their messages"
  ON public.group_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX group_messages_group_created_idx ON public.group_messages (group_id, created_at);

ALTER TABLE public.group_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;