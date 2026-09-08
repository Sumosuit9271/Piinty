-- Private contact details table
CREATE TABLE public.user_contacts (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_contacts TO authenticated;
GRANT ALL ON public.user_contacts TO service_role;

ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contact" ON public.user_contacts
FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own contact" ON public.user_contacts
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own contact" ON public.user_contacts
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Migrate existing data and drop the sensitive column from profiles
INSERT INTO public.user_contacts (id, contact)
SELECT id, phone_number FROM public.profiles
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN phone_number;

-- Profiles are now safe for group mates to read
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = on) AS
SELECT p.id, p.display_name, p.avatar_url, p.created_at
FROM public.profiles p;
GRANT SELECT ON public.public_profiles TO authenticated;

CREATE POLICY "Users can view group members profiles"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() <> id AND public.share_group_with_user(auth.uid(), id));

-- Signup trigger writes the new shape
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(COALESCE(new.email, new.phone), '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_contacts (id, contact)
  VALUES (new.id, COALESCE(new.email, new.phone))
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$function$;

-- Restrict helper function execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.share_group_with_user(uuid, uuid) FROM anon;