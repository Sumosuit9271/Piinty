-- 1. Allow self-join (invite links)
CREATE POLICY "Users can join groups themselves"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2. Lock profiles base table down to the owner only
DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;

-- Limited view for group mates
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT p.id, p.display_name, p.avatar_url, p.created_at
FROM public.profiles p
WHERE p.id = auth.uid()
   OR public.share_group_with_user(auth.uid(), p.id);

GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS pints_group_id_idx ON public.pints (group_id);
CREATE INDEX IF NOT EXISTS pints_group_paid_idx ON public.pints (group_id, paid);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS groups_created_by_idx ON public.groups (created_by);