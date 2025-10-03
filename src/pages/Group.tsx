import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GroupHeader } from "@/components/GroupHeader";
import { PintMatrix } from "@/components/PintMatrix";
import { TallySection } from "@/components/TallySection";
import { AddPintDialog } from "@/components/AddPintDialog";
import { PintHistoryDialog } from "@/components/PintHistoryDialog";
import { Leaderboard } from "@/components/Leaderboard";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { UserMinus, Users, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  display_name: string;
}

const Group = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Profile[]>([]);
  const [pints, setPints] = useState<Record<string, PintEntry[]>>({});
  const [loading, setLoading] = useState(true);

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
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  useEffect(() => {
    checkAuthAndLoadGroup();
  }, [groupId]);

  const checkAuthAndLoadGroup = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    loadGroupData();
  };

  const loadGroupData = async () => {
    if (!groupId) return;

    try {
      // Load group info
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("name")
        .eq("id", groupId)
        .single();

      if (groupError) throw groupError;
      setGroupName(group.name);

      // Load group members
      const { data: membersData, error: membersError } = await supabase
        .from("group_members")
        .select("profiles(id, display_name)")
        .eq("group_id", groupId);

      if (membersError) throw membersError;
      
      const profilesList = membersData
        .map((m: any) => m.profiles)
        .filter(Boolean);
      setMembers(profilesList);

      // Load pints
      const { data: pintsData, error: pintsError } = await supabase
        .from("pints")
        .select(`
          *,
          from_profile:from_user_id(display_name),
          to_profile:to_user_id(display_name)
        `)
        .eq("group_id", groupId);

      if (pintsError) throw pintsError;

      // Convert to the format expected by components
      const pintsMap: Record<string, PintEntry[]> = {};
      pintsData.forEach((pint: any) => {
        const key = `${pint.from_profile.display_name}->${pint.to_profile.display_name}`;
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

  const confirmAddPint = async (note: string, photo?: string) => {
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

  const handleAddMember = async () => {
    const trimmed = newMemberPhone.trim();
    if (!trimmed || !groupId) return;

    try {
      // Find user by phone
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("phone_number", trimmed)
        .single();

      if (profileError) {
        toast({
          title: "User not found",
          description: "No user with that phone number",
          variant: "destructive",
        });
        return;
      }

      // Add to group
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupId,
          user_id: profile.id,
        });

      if (memberError) {
        if (memberError.code === "23505") {
          toast({
            title: "Already a member",
            description: "This user is already in the group",
            variant: "destructive",
          });
        } else {
          throw memberError;
        }
        return;
      }

      toast({
        title: "Member added!",
        description: `${profile.display_name} joined the group`,
      });

      setNewMemberPhone("");
      setAddMemberDialog(false);
      loadGroupData();
    } catch (error: any) {
      toast({
        title: "Error adding member",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (member: Profile) => {
    if (members.length <= 2) {
      toast({
        title: "Cannot remove",
        description: "Need at least 2 members",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", member.id);

      if (error) throw error;

      toast({
        title: "Member removed",
        description: `${member.display_name} left the group`,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const memberNames = members.map(m => m.display_name);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/groups")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GroupHeader
            groupName={groupName}
            onAddMember={() => setAddMemberDialog(true)}
            onSettings={() => {
              setNewGroupName(groupName);
              setSettingsDialog(true);
            }}
          />
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Leaderboard members={memberNames} pints={pints} />

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Who Owes Who?</h2>
            <p className="text-sm text-muted-foreground">
              Track pints between your mates
            </p>
          </div>
          <PintMatrix
            members={memberNames}
            pints={pints}
            onAddPint={handleAddPint}
            onClearPint={handleClearPint}
            onViewHistory={handleViewHistory}
          />
        </section>

        <section>
          <TallySection members={memberNames} pints={pints} />
        </section>
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
        pints={pints[`${historyDialog.from}->${historyDialog.to}`] || []}
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
              Enter their phone number to add them
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="member-phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="member-phone"
              placeholder="e.g., 07123456789"
              value={newMemberPhone}
              onChange={(e) => setNewMemberPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddMember();
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberPhone.trim()}>
              Add Member
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
                    <span className="text-sm">{member.display_name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoveMember(member)}
                    >
                      <UserMinus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Group;
