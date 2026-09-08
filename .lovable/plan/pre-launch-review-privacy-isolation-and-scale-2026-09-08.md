# Pre-launch review: privacy, isolation and scale

## Short answer on privacy

Groups are properly walled off. Checked the database rules directly:

- A group is only visible to people who are members of it (or the person who made it).
- Pints, members and chat messages in a group are only readable by members of that group.
- Nobody can browse a list of other people's groups, and guessing a group link does not let an outsider read it.

Two real problems found alongside that:

1. **Invite links can't actually add anyone.** The rule for joining a group only lets the group's creator add people. When an invited friend signs up through an invite link, the join silently fails and they land on a group they can't see. This is broken today and will look like "the app doesn't work" the moment you share it widely.
2. **Sign-in emails are visible to fellow group members.** When email sign-up was added, the email is stored in the old phone-number field on the profile, and group mates can read that field. Group mates should only see a name and picture.

## What would break if it blew up

- **Missing database indexes.** Confirmed: there are no indexes on pints by group, group members by user, or groups by creator. With a few hundred users it's fine; with real traffic every group screen scans whole tables and gets slow. Chat already has its index.
- **Pints are matched by display name, not by person.** Pint history is keyed on "Alice->Bob" text. Two mates with the same name in one group, or someone renaming themselves, will scramble the balances. This is the most likely source of confusing bugs at scale.
- **No limits on what a screen loads.** A group loads every pint it has ever had, at once. Fine early, heavy for a long-running group.
- **"Remember me" is unreliable.** Unchecking it tries to sign out during page-close, which browsers often skip, so it may not do what it says.
- **No crash safety net.** One unexpected error blanks the screen instead of showing a friendly "something went wrong".
- **Add member by phone number no longer works** since sign-up moved to email — it searches for a phone number that new users no longer have.

## Proposed work, in order

**1. Make invites work (must-have before launch)**
Allow a signed-in person to add themselves to a group when they arrive through an invite link, while keeping "only the creator can add other people". Make the join happen on sign-in as well as sign-up, so an existing user clicking an invite link also gets in.

**2. Stop exposing emails**
Keep each person's email/phone readable only by themselves. Group mates get name, picture and joined date only. Update the member list, matrix, leaderboard and chat to use that limited view.

**3. Fix "add member" to search by email** instead of phone number, with a clear "no account with that email — send them your invite link" message.

**4. Performance groundwork**
Add the missing indexes (pints by group, members by user, groups by creator, plus pints by paid state). Cap the pint history load per group with paging for older entries.

**5. Robustness polish**
- Replace the "remember me" trick with a proper stay-signed-in / sign-out-on-close behaviour.
- Add a whole-app error screen so a crash shows a message and a reload button.
- Identify pints by person, not by name text, so duplicate or changed names can't corrupt balances.

## Technical detail

- RLS: add `group_members` INSERT policy `user_id = auth.uid()` (self-join) alongside the existing creator policy; keep DELETE self-only.
- Profiles: restrict base-table SELECT to `auth.uid() = id`; create `public_profiles` view (`id, display_name, avatar_url, created_at`) with `security_invoker = off`, grant SELECT to `authenticated`, restricted to shared-group users via a helper; repoint `Group.tsx`, `Groups.tsx`, `GroupChat.tsx`, `Leaderboard.tsx`.
- Indexes: `pints(group_id)`, `pints(group_id, paid)`, `group_members(user_id)`, `groups(created_by)`.
- Pint keying: change the in-memory `pints` map key from `display_name->display_name` to `from_user_id->to_user_id`, resolving names at render time in `PintMatrix`/`PintHistoryDialog`.
- Auth: replace the `beforeunload` sign-out with storage-scoped session handling; move invite auto-join into a shared helper called after both sign-up and sign-in.
- Add a React error boundary around the router in `App.tsx`.
- Capacity: Cloud handles this workload easily at launch scale; the limiting factors are the missing indexes and unbounded per-group reads, not the server itself.
