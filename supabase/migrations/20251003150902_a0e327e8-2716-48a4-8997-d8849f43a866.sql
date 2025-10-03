-- Create a security definer function to check if two users share any groups
-- This prevents RLS recursion issues and allows efficient group membership checking
CREATE OR REPLACE FUNCTION public.share_group_with_user(user_id_param uuid, other_user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM group_members gm1
    INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = user_id_param
    AND gm2.user_id = other_user_id_param
  );
$$;

-- Drop the insecure policy that allows all authenticated users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new restrictive policy that only allows users to view:
-- 1. Their own profile
-- 2. Profiles of users they share groups with
CREATE POLICY "Users can view profiles in shared groups"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  public.share_group_with_user(auth.uid(), id)
);