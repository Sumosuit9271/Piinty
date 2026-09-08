# Delete groups and remove members

Today a group lasts forever and nobody can be taken out of it. This adds tidy-up controls.

## What you'll be able to do

- The person who made a group can delete it. A confirm step warns that all pints, photos and chat in it go too.
- The person who made a group can remove a member from it.
- Anyone can leave a group they're in (the creator must delete the group rather than leave it).
- After removing or leaving, the screen updates straight away and the person who left no longer sees the group.

## Where the controls live

- Group screen menu: "Remove member" (creator only) and "Leave group" / "Delete group".
- Member list in the matrix: a small remove action next to each member for the creator.
- Sample mates are unaffected — they're only on your own device and already removable.

## Technical notes

- Migration:
  - Re-point child foreign keys at `groups` with `ON DELETE CASCADE`: `pints.group_id`, `group_messages.group_id`, `group_members.group_id`. Also `ON DELETE CASCADE` on `pints.from_user_id` / `pints.to_user_id` is not wanted — instead deleting a member leaves their pint history in place, so those stay as-is.
  - `CREATE POLICY` on `groups` for DELETE: `created_by = auth.uid()`.
  - `CREATE POLICY` on `group_members` for DELETE by the group creator: `EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.created_by = auth.uid())`. The existing self-leave policy stays; add a guard so the creator cannot leave their own group (handled in UI plus a policy condition `user_id <> (SELECT created_by FROM groups WHERE id = group_id)` on the self-leave path).
- Frontend (`src/pages/Group.tsx`, `src/components/GroupHeader.tsx`):
  - Track `isCreator` from the loaded group's `created_by`.
  - `AlertDialog` confirmations for delete group, remove member, leave group.
  - On delete/leave, navigate back to `/groups`; on remove, refresh the member and pint state.
  - Toasts for success and failure.
