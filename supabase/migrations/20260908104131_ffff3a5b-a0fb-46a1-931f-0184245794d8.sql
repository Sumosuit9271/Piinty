-- Cascade children when a group is deleted
ALTER TABLE public.pints DROP CONSTRAINT IF EXISTS pints_group_id_fkey;
ALTER TABLE public.pints
  ADD CONSTRAINT pints_group_id_fkey FOREIGN KEY (group_id)
  REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_messages DROP CONSTRAINT IF EXISTS group_messages_group_id_fkey;
ALTER TABLE public.group_messages
  ADD CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id)
  REFERENCES public.groups(id) ON DELETE CASCADE;

ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE public.group_members
  ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id)
  REFERENCES public.groups(id) ON DELETE CASCADE;

-- Creator can delete their group
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.groups;
CREATE POLICY "Group creators can delete their groups"
ON public.groups FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Creator can remove members
DROP POLICY IF EXISTS "Group creators can remove members" ON public.group_members;
CREATE POLICY "Group creators can remove members"
ON public.group_members FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.groups g
  WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
));

-- Members can leave, but the creator cannot leave their own group
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
ON public.group_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
);