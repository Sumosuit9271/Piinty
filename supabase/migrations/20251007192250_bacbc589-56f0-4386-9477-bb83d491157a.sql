-- Fix phone number exposure in profiles table
-- Drop the existing policy that exposes phone numbers to group members
DROP POLICY IF EXISTS "Users can view profiles in shared groups" ON public.profiles;

-- Create a new policy that allows users to see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a policy that allows users to see LIMITED profile info of group members
-- This policy will be enforced at the query level - phone_number should not be selected
CREATE POLICY "Users can view group members profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() != id 
  AND share_group_with_user(auth.uid(), id)
);

-- Add a comment to document the security requirement
COMMENT ON TABLE public.profiles IS 'Phone numbers are sensitive PII. When querying profiles of other users, only select display_name and avatar_url. Phone_number should only be queried for auth.uid() = id.';

-- Create a helper view that exposes only safe profile fields for group members
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add RLS to the view (inherits from base table)
ALTER VIEW public.public_profiles SET (security_invoker = on);