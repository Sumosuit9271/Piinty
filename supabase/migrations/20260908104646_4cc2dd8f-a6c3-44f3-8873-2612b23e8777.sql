DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Signup trigger also grants admin to the owner's email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF lower(COALESCE(new.email, '')) = 'maxwhelan10@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Admin-only growth stats
CREATE OR REPLACE FUNCTION public.admin_growth_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM auth.users),
    'total_groups', (SELECT count(*) FROM public.groups),
    'total_memberships', (SELECT count(*) FROM public.group_members),
    'users_today', (SELECT count(*) FROM auth.users WHERE created_at >= date_trunc('day', now())),
    'users_7d', (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days'),
    'users_30d', (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '30 days'),
    'groups_today', (SELECT count(*) FROM public.groups WHERE created_at >= date_trunc('day', now())),
    'groups_7d', (SELECT count(*) FROM public.groups WHERE created_at >= now() - interval '7 days'),
    'groups_30d', (SELECT count(*) FROM public.groups WHERE created_at >= now() - interval '30 days'),
    'daily', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'users', (SELECT count(*) FROM auth.users u WHERE u.created_at >= d.day AND u.created_at < d.day + interval '1 day'),
        'groups', (SELECT count(*) FROM public.groups g WHERE g.created_at >= d.day AND g.created_at < d.day + interval '1 day')
      ) ORDER BY d.day), '[]'::jsonb)
      FROM generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') AS d(day)
    ),
    'recent_signups', (
      SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT to_char(u.created_at, 'YYYY-MM-DD HH24:MI') AS joined_at,
               COALESCE(p.display_name, 'Mate') AS display_name
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        ORDER BY u.created_at DESC
        LIMIT 10
      ) x
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_growth_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_growth_stats() TO authenticated;