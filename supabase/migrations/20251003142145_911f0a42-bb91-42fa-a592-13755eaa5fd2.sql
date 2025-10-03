-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can view groups they're members of" ON public.groups;

-- Create a security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(group_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_id_param
    AND user_id = user_id_param
  );
$$;

-- Recreate policies using the function
CREATE POLICY "Users can view groups they're members of"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "Users can view members of their groups"
  ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));