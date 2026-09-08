import { supabase } from "@/integrations/supabase/client";

const REMEMBER_KEY = "piinty.rememberMe";
const TAB_KEY = "piinty.tabSession";

/** Store whether the user wants to stay signed in after closing the browser. */
export function setRememberMe(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  sessionStorage.setItem(TAB_KEY, "1");
}

/**
 * If the user chose not to stay signed in, sign them out the first time the
 * app loads in a brand new browser session. Reliable, unlike unload handlers.
 */
export async function enforceRememberMePolicy(): Promise<void> {
  const remember = localStorage.getItem(REMEMBER_KEY) !== "false";
  const sameBrowserSession = sessionStorage.getItem(TAB_KEY) === "1";

  if (!remember && !sameBrowserSession) {
    await supabase.auth.signOut();
  }
  sessionStorage.setItem(TAB_KEY, "1");
}

/** Join a group from an invite link. Safe to call more than once. */
export async function joinGroupFromInvite(groupId: string, userId: string) {
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: userId });

  // 23505 = already a member
  if (error && error.code !== "23505") {
    console.error("Could not join group from invite:", error.message);
    return false;
  }
  return true;
}
