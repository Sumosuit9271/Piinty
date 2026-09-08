import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GroupHeader } from "@/components/GroupHeader";
import { PintMatrix } from "@/components/PintMatrix";
import { TallySection } from "@/components/TallySection";
import { AddPintDialog } from "@/components/AddPintDialog";
import { PintHistoryDialog } from "@/components/PintHistoryDialog";
import { Leaderboard } from "@/components/Leaderboard";
import { GroupChat } from "@/components/GroupChat";
import { PintEntry } from "@/types/pint";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserMinus, Users, ArrowLeft, Share2, Trash2, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { enforceRememberMePolicy } from "@/lib/session";

interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}



const Group = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [groupAvatarUrl, setGroupAvatarUrl] = useState<string | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [pints, setPints] = useState<Record<string, PintEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [demoNames, setDemoNames] = useState<string[]>([]);
  const [newDemoName, setNewDemoName] = useState("");
  const [demoAvatars, setDemoAvatars] = useState<Record<string, string>>({});
  const [demoPints, setDemoPints] = useState<Record<string, PintEntry[]>>({});


  const [addPintDialog, setAddPintDialog] = useState<{
    open: boolean;
    from: string;
    to: string;
  }>({ open: false, from: "", to: "" });

  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    from: string;
    to: string;
  }>({ open: false, from: "", to: "" });

  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupCreatedBy, setGroupCreatedBy] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<Profile | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [confirmLeaveGroup, setConfirmLeaveGroup] = useState(false);

  useEffect(() => {
    checkAuthAndLoadGroup();
  }, [groupId]);

  const checkAuthAndLoadGroup = async () => {
    await enforceRememberMePolicy();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setCurrentUserId(session.user.id);
    loadGroupData();
  };

  const loadGroupData = async () => {
    if (!groupId) return;

    try {
      // Load group info
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("name, avatar_url, created_by")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroupName(group.name);
      setGroupAvatarUrl(group.avatar_url);
      setGroupCreatedBy(group.created_by);

      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("profiles(id, display_name, avatar_url)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;

      const rawProfiles = membersData
        .map((m: any) => m.profiles)
        .filter(Boolean);

      // Make sure two mates with the same name never share a column
      const nameCounts: Record<string, number> = {};
      const profilesList = rawProfiles.map((p: any) => {
        const base = (p.display_name || "Mate").trim() || "Mate";
        nameCounts[base] = (nameCounts[base] || 0) + 1;
        return {
          ...p,
          display_name: nameCounts[base] > 1 ? `${base} (${nameCounts[base]})` : base,
        };
      });
      setMembers(profilesList);

      const nameById: Record<string, string> = {};
      profilesList.forEach((p: any) => { nameById[p.id] = p.display_name; });

      // Load pints (most recent first, capped so long-running groups stay fast)
      const { data: pintsData, error: pintsError } = await supabase
        .from("pints")
        .select("from_user_id, to_user_id, note, photo, paid, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (pintsError) throw pintsError;

      // Convert to the format expected by components (oldest first)
      const pintsMap: Record<string, PintEntry[]> = {};
      [...pintsData].reverse().forEach((pint: any) => {
        const from = nameById[pint.from_user_id];
        const to = nameById[pint.to_user_id];
        if (!from || !to) return;
        const key = `${from}->${to}`;
        if (!pintsMap[key]) pintsMap[key] = [];
        pintsMap[key].push({
          note: pint.note || "",
          timestamp: new Date(pint.created_at).getTime(),
          paid: pint.paid,
          photo: pint.photo,
        });
      });

      setPints(pintsMap);
    } catch (error: any) {
      toast({
        title: "Error loading group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPint = (from: string, to: string) => {
    setAddPintDialog({ open: true, from, to });
  };

  const isDemoPair = (from: string, to: string) =>
    demoNames.includes(from) || demoNames.includes(to);

  const addDemoMate = () => {
    const name = newDemoName.trim();
    if (!name) return;
    const taken = [...members.map((m) => m.display_name), ...demoNames].some(
      (n) => n.toLowerCase() === name.toLowerCase()
    );
    if (taken) {
      toast({
        title: "Name already used",
        description: "Pick a different name for your sample mate",
        variant: "destructive",
      });
      return;
    }
    setDemoNames((prev) => [...prev, name]);
    setNewDemoName("");
  };

  const setDemoPhoto = (name: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please pick an image", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too big", description: "Max 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDemoAvatars((prev) => ({ ...prev, [name]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeDemoMate = (name: string) => {
    setDemoNames((prev) => prev.filter((n) => n !== name));
    setDemoAvatars((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setDemoPints((prev) => {
      const next: Record<string, PintEntry[]> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [from, to] = key.split("->");
        if (from !== name && to !== name) next[key] = value;
      });
      return next;
    });
  };

  const confirmAddPint = async (note: string, photo?: string) => {
    if (isDemoPair(addPintDialog.from, addPintDialog.to)) {
      const key = `${addPintDialog.from}->${addPintDialog.to}`;
      setDemoPints((prev) => ({
        ...prev,
        [key]: [
          ...(prev[key] || []),
          { note: note.trim(), timestamp: Date.now(), paid: false, photo },
        ],
      }));
      toast({
        title: "Pint added! 🍺",
        description: `${addPintDialog.from} owes ${addPintDialog.to} a pint (sample)`,
      });
      return;
    }

    try {
      const fromUser = members.find(m => m.display_name === addPintDialog.from);
      const toUser = members.find(m => m.display_name === addPintDialog.to);

      if (!fromUser || !toUser || !groupId) return;


      const { error } = await supabase.from("pints").insert({
        group_id: groupId,
        from_user_id: fromUser.id,
        to_user_id: toUser.id,
        note: note.trim(),
        ...(photo && { photo }),
        paid: false,
      });

      if (error) throw error;

      toast({
        title: "Pint added! 🍺",
        description: note
          ? `${addPintDialog.from} owes ${addPintDialog.to}: "${note}"`
          : `${addPintDialog.from} owes ${addPintDialog.to} a pint`,
      });

      loadGroupData();
    } catch (error: any) {
      toast({
        title: "Error adding pint",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClearPint = async (from: string, to: string) => {
    if (isDemoPair(from, to)) {
      const key = `${from}->${to}`;
      setDemoPints((prev) => {
        const list = [...(prev[key] || [])];
        for (let i = list.length - 1; i >= 0; i--) {
          if (!list[i].paid) {
            list[i] = { ...list[i], paid: true };
            break;
          }
        }
        return { ...prev, [key]: list };
      });
      toast({ title: "Pint cleared! ✓", description: `${from} paid back ${to}` });
      return;
    }

    try {
      const fromUser = members.find(m => m.display_name === from);
      const toUser = members.find(m => m.display_name === to);

      if (!fromUser || !toUser || !groupId) return;

      // Find the most recent unpaid pint
      const { data: unpaidPints, error: fetchError } = await supabase
        .from("pints")
        .select("id")
        .eq("group_id", groupId)
        .eq("from_user_id", fromUser.id)
        .eq("to_user_id", toUser.id)
        .eq("paid", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (unpaidPints && unpaidPints.length > 0) {
        const { error: updateError } = await supabase
          .from("pints")
          .update({ paid: true })
          .eq("id", unpaidPints[0].id);

        if (updateError) throw updateError;

        toast({
          title: "Pint cleared! ✓",
          description: `${from} paid back ${to}`,
        });

        loadGroupData();
      }
    } catch (error: any) {
      toast({
        title: "Error clearing pint",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewHistory = (from: string, to: string) => {
    setHistoryDialog({ open: true, from, to });
  };

  const handleTogglePaid = async (index: number) => {
    if (isDemoPair(historyDialog.from, historyDialog.to)) {
      const key = `${historyDialog.from}->${historyDialog.to}`;
      setDemoPints((prev) => {
        const list = [...(prev[key] || [])];
        if (list[index]) list[index] = { ...list[index], paid: !list[index].paid };
        return { ...prev, [key]: list };
      });
      return;
    }

    try {
      const key = `${historyDialog.from}->${historyDialog.to}`;
      const entry = pints[key]?.[index];
      if (!entry) return;


      const fromUser = members.find(m => m.display_name === historyDialog.from);
      const toUser = members.find(m => m.display_name === historyDialog.to);

      if (!fromUser || !toUser || !groupId) return;

      // Find the actual pint ID from database
      const { data: pintsData, error: fetchError } = await supabase
        .from("pints")
        .select("id")
        .eq("group_id", groupId)
        .eq("from_user_id", fromUser.id)
        .eq("to_user_id", toUser.id)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      if (pintsData && pintsData[index]) {
        const { error: updateError } = await supabase
          .from("pints")
          .update({ paid: !entry.paid })
          .eq("id", pintsData[index].id);

        if (updateError) throw updateError;

        toast({
          title: !entry.paid ? "Pint paid! ✓" : "Pint unpaid",
          description: !entry.paid
            ? `${historyDialog.from} paid back ${historyDialog.to}`
            : "Marked as unpaid",
        });

        loadGroupData();
      }
    } catch (error: any) {
      toast({
        title: "Error updating pint",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Mates join by opening the group's invite link (see handleShareInvite).


  const handleRemoveMember = async (member: Profile) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", member.id);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: `${member.display_name} is no longer in the group`,
      });

      loadGroupData();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    try {
      const { error } = await supabase.from("groups").delete().eq("id", groupId);
      if (error) throw error;

      toast({
        title: "Group deleted",
        description: `"${groupName}" and everything in it is gone`,
      });
      navigate("/groups");
    } catch (error: any) {
      toast({
        title: "Error deleting group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !currentUserId) return;
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      toast({
        title: "You left the group",
        description: `You're no longer in "${groupName}"`,
      });
      navigate("/groups");
    } catch (error: any) {
      toast({
        title: "Error leaving group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateGroupName = async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || !groupId) return;

    try {
      const { error } = await supabase
        .from("groups")
        .update({ name: trimmed })
        .eq("id", groupId);

      if (error) throw error;

      toast({
        title: "Group renamed!",
        description: `Now called "${trimmed}"`,
      });

      setNewGroupName("");
      setSettingsDialog(false);
      setGroupName(trimmed);
    } catch (error: any) {
      toast({
        title: "Error updating group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleShareInvite = () => {
    const inviteUrl = `${window.location.origin}/auth?invite=${groupId}&name=${encodeURIComponent(groupName)}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${groupName} on Pintpal`,
        text: `Join our group "${groupName}" to track pints together!`,
        url: inviteUrl,
      }).catch(() => {
        copyToClipboard(inviteUrl);
      });
    } else {
      copyToClipboard(inviteUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copied!",
      description: "Share this link with friends to invite them",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const memberNames = [
    ...members.map(m => m.display_name),
    ...demoNames,
  ];
  const memberAvatars = members.reduce((acc, m) => {
    acc[m.display_name] = m.avatar_url || null;
    return acc;
  }, {} as Record<string, string | null>);
  demoNames.forEach((n) => { memberAvatars[n] = demoAvatars[n] || null; });
  const allPints = { ...pints, ...demoPints };


  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/groups")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GroupHeader
            groupName={groupName}
            groupAvatarUrl={groupAvatarUrl}
            groupId={groupId || ""}
            onAddMember={() => setAddMemberDialog(true)}
            onSettings={() => {
              setNewGroupName(groupName);
              setSettingsDialog(true);
            }}
            onAvatarUpdate={(url) => setGroupAvatarUrl(url)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShareInvite}
            title="Share invite link"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-up">
            <p className="text-sm text-muted-foreground">Invite your mates to Piinty</p>
            <Button variant="outline" size="sm" onClick={handleShareInvite}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <div className="glass-card rounded-2xl p-4 space-y-3 animate-fade-up">
            <p className="text-sm text-muted-foreground">
              Try it out with pretend mates — practice only, not saved.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={newDemoName}
                onChange={(e) => setNewDemoName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDemoMate();
                  }
                }}
                placeholder="Name your sample mate"
                maxLength={24}
                className="rounded-full h-9"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addDemoMate}
                disabled={!newDemoName.trim()}
              >
                Add
              </Button>
            </div>
            {demoNames.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {demoNames.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded-full bg-muted pl-1 pr-2 py-1"
                  >
                    <label className="cursor-pointer" title="Add a picture">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={demoAvatars[name]} />
                        <AvatarFallback className="text-[10px]">
                          {name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setDemoPhoto(name, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <span className="text-xs">{name}</span>
                    <button
                      onClick={() => removeDemoMate(name)}
                      className="text-xs text-muted-foreground hover:text-destructive"
                      title="Remove sample mate"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Leaderboard members={memberNames} memberAvatars={memberAvatars} pints={allPints} />

        <section className="animate-fade-up">
          <div className="mb-4">
            <h2 className="font-display text-2xl">Who owes who?</h2>
            <p className="text-sm text-muted-foreground">
              Rows owe columns. Keep the slate honest.
            </p>
          </div>

          <PintMatrix
            members={memberNames}
            memberAvatars={memberAvatars}
            pints={allPints}
            onAddPint={handleAddPint}
            onClearPint={handleClearPint}
            onViewHistory={handleViewHistory}
          />
        </section>

        <section>
          <TallySection members={memberNames} pints={allPints} />
        </section>

        <GroupChat groupId={groupId || ""} members={members} />


      </main>

      <AddPintDialog
        open={addPintDialog.open}
        onClose={() => setAddPintDialog({ open: false, from: "", to: "" })}
        fromMember={addPintDialog.from}
        toMember={addPintDialog.to}
        onConfirm={confirmAddPint}
      />

      <PintHistoryDialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false, from: "", to: "" })}
        fromMember={historyDialog.from}
        toMember={historyDialog.to}
        pints={allPints[`${historyDialog.from}->${historyDialog.to}`] || []}
        onTogglePaid={handleTogglePaid}
      />

      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Add Member
            </DialogTitle>
            <DialogDescription>
              Send your mates this link — they join {groupName} as soon as they
              sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-muted p-3 text-xs break-all text-muted-foreground">
            {`${window.location.origin}/auth?invite=${groupId}&name=${encodeURIComponent(groupName)}`}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>
              Close
            </Button>
            <Button onClick={handleShareInvite}>
              <Share2 className="h-4 w-4" />
              Share invite link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Manage your group name and members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="group-name" className="text-sm font-medium">
                Group Name
              </label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={50}
              />
              <Button
                size="sm"
                onClick={handleUpdateGroupName}
                disabled={!newGroupName.trim() || newGroupName === groupName}
              >
                Update Name
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Members</label>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                  >
                    <span className="text-sm">
                      {member.display_name}
                      {member.id === groupCreatedBy && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Owner
                        </span>
                      )}
                    </span>
                    {isCreator && member.id !== groupCreatedBy && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={`Remove ${member.display_name}`}
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <label className="text-sm font-medium">Danger zone</label>
              {isCreator ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Deleting removes every pint, photo and message in this group.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmDeleteGroup(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete group
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Leaving takes this group off your list.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmLeaveGroup(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    Leave group
                  </Button>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {memberToRemove?.display_name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They'll lose access to this group. Their pint history stays on the slate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const member = memberToRemove;
                setMemberToRemove(null);
                if (member) handleRemoveMember(member);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDeleteGroup} onOpenChange={setConfirmDeleteGroup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{groupName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Every pint, photo and message in this group is deleted for everyone.
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDeleteGroup(false);
                handleDeleteGroup();
              }}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmLeaveGroup} onOpenChange={setConfirmLeaveGroup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave "{groupName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see this group any more. Someone can invite you back with
              the group's link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmLeaveGroup(false);
                handleLeaveGroup();
              }}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Group;
