# Ready for a stranger to sign up and share

## What I checked

- Sign-up creates an account instantly (no email confirmation step), so a brand new person lands straight in the app. Confirmed against the three existing accounts: each was active the same millisecond it was created.
- Sign-up automatically creates their name record and keeps their email in a private, owner-only record.
- Opening an invite link takes a new person to sign-up and then adds them to that group automatically; opening it twice is harmless.
- Groups, pints, photos and chat are only readable by people who are in the group, so a stranger who never got a link sees nothing.

So yes: someone can find Piinty, sign up, create a group and share it, and it works.

## Two gaps worth closing before you promote it

1. Invite links are permanent and unlimited. Anyone the link is forwarded to can join the group, forever. Add a simple control for the group creator:
   - a toggle to turn the invite link on or off
   - a "reset link" action that makes old links stop working
2. Nobody can delete a group or remove a member. Once a group exists it stays. Add:
   - creator can delete their group (and everything inside it)
   - creator can remove a member; any member can leave

## Technical notes

- Invite control: add `invite_code` (random text, default generated) and `invite_enabled` (boolean, default true) to `groups`. Invite URL becomes `/auth?invite=<code>`. Joining moves into a `SECURITY DEFINER` function `join_group_by_code(code)` that resolves the code, checks `invite_enabled`, and inserts the membership; the current self-join policy on `group_members` is then dropped so group IDs alone grant nothing. `Group.tsx` share dialog gains enable/disable and regenerate buttons; `Auth.tsx` calls the new function and reads the returned group id for navigation.
- Deletion: `ON DELETE CASCADE` on `pints`, `group_messages`, `group_members` pointing at `groups`, plus a DELETE policy on `groups` for `created_by = auth.uid()` and a DELETE policy on `group_members` allowing the group creator to remove others (self-leave policy already exists). UI: menu entries in `GroupHeader` with confirm dialogs.
- No schema or index work needed for load; indexes on `pints(group_id)`, `pints(group_id, paid)`, `group_members(user_id)` and `groups(created_by)` are already in place.
- After these changes, publish so the live site picks them up.
