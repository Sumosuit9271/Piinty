# Private admin dashboard

A stats page only you can see, at `/admin`. Everyone else gets sent back to their groups — the numbers are never sent to a normal user's browser.

Note: `maxwhelan10@gmail.com` has no account yet. It will be marked as the admin automatically the moment you sign up with that email.

## What you'll see (growth)

Top row of cards:
- Total users
- Total groups
- New users today / last 7 days / last 30 days
- New groups today / last 7 days / last 30 days

Below:
- A simple bar chart of sign-ups per day for the last 30 days
- The same chart for groups created per day
- A short table of the most recent sign-ups (join date only, no email addresses shown)

A refresh button re-pulls the numbers.

## How access works

- A separate roles list decides who is an admin — never a flag on your profile, so it can't be edited by a user.
- The dashboard's numbers come from one server-side call that checks your admin role before returning anything.

## Technical notes

- Migration:
  - `CREATE TYPE public.app_role AS ENUM ('admin','user');`
  - `CREATE TABLE public.user_roles (id uuid pk default gen_random_uuid(), user_id uuid not null, role app_role not null, created_at timestamptz not null default now(), unique(user_id, role))`, then `GRANT SELECT ON public.user_roles TO authenticated; GRANT ALL TO service_role;`, enable RLS, policy: a user may read their own rows only (`user_id = auth.uid()`); no client insert/update/delete.
  - `public.has_role(_user_id uuid, _role app_role) returns boolean` — `SECURITY DEFINER`, `stable`, `set search_path = public`.
  - Extend the existing `handle_new_user()` trigger: when `new.email = 'maxwhelan10@gmail.com'`, also insert an `admin` row into `user_roles` (on conflict do nothing).
  - `public.admin_growth_stats()` — `SECURITY DEFINER`, `set search_path = public`, returns JSON. First line: `if not has_role(auth.uid(),'admin') then raise exception 'not authorized'; end if;`. Returns totals plus 30-day daily series for `auth.users` and `public.groups` (counts and dates only, no emails). `REVOKE EXECUTE ... FROM anon; GRANT EXECUTE ... TO authenticated;`
- Frontend:
  - `src/pages/Admin.tsx` — calls `supabase.rpc('admin_growth_stats')`; on error or non-admin, redirect to `/groups`.
  - Route `/admin` added in `src/App.tsx` above the catch-all.
  - Charts with `recharts` (already used by shadcn chart component), styled with existing design tokens.
  - No link to `/admin` in the normal navigation; a small "Dashboard" entry appears on the Groups screen only when `has_role` returns true for you.
