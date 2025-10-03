-- Replace groups SELECT policy to also allow creators to view their groups
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.groups;

CREATE POLICY "Users can view groups they're members or creators of"
  ON public.groups FOR SELECT
  USING (
    public.is_group_member(id, auth.uid())
    OR created_by = auth.uid()
  );