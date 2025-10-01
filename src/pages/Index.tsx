import { useState, useEffect } from "react";
import { GroupHeader } from "@/components/GroupHeader";
import { PintMatrix } from "@/components/PintMatrix";
import { TallySection } from "@/components/TallySection";
import { AddPintDialog } from "@/components/AddPintDialog";
import { PintHistoryDialog } from "@/components/PintHistoryDialog";
import { GroupData, PintEntry } from "@/types/pint";
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
import { UserMinus, Users } from "lucide-react";

const STORAGE_KEY = "pint-tracker-data";

const Index = () => {
  const [groupData, setGroupData] = useState<GroupData>({
    groupName: "The Pub Crew",
    members: ["Alice", "Bob", "Charlie"],
    pints: {},
  });

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
  const [newMemberName, setNewMemberName] = useState("");

  const [settingsDialog, setSettingsDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Migrate old data format (numbers) to new format (arrays)
        const migratedPints: Record<string, PintEntry[]> = {};
        Object.entries(parsed.pints || {}).forEach(([key, value]) => {
          if (typeof value === 'number') {
            // Old format: convert number to array of entries
            migratedPints[key] = Array.from({ length: value }, () => ({
              note: "",
              timestamp: Date.now(),
            }));
          } else if (Array.isArray(value)) {
            // New format: keep as is
            migratedPints[key] = value;
          } else {
            // Invalid format: reset to empty array
            migratedPints[key] = [];
          }
        });

        setGroupData({
          ...parsed,
          pints: migratedPints,
        });
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groupData));
  }, [groupData]);

  const handleAddPint = (from: string, to: string) => {
    setAddPintDialog({ open: true, from, to });
  };

  const confirmAddPint = (note: string) => {
    const key = `${addPintDialog.from}->${addPintDialog.to}`;
    const newEntry: PintEntry = {
      note: note.trim(),
      timestamp: Date.now(),
    };

    setGroupData((prev) => ({
      ...prev,
      pints: {
        ...prev.pints,
        [key]: [...(prev.pints[key] || []), newEntry],
      },
    }));

    toast({
      title: "Pint added! 🍺",
      description: note
        ? `${addPintDialog.from} owes ${addPintDialog.to}: "${note}"`
        : `${addPintDialog.from} owes ${addPintDialog.to} a pint`,
    });
  };

  const handleClearPint = (from: string, to: string) => {
    const key = `${from}->${to}`;
    const currentEntries = groupData.pints[key] || [];

    if (currentEntries.length > 0) {
      // Remove the most recent pint
      setGroupData((prev) => ({
        ...prev,
        pints: {
          ...prev.pints,
          [key]: currentEntries.slice(0, -1),
        },
      }));

      toast({
        title: "Pint cleared! ✓",
        description: `${from} paid back ${to}`,
      });
    }
  };

  const handleViewHistory = (from: string, to: string) => {
    setHistoryDialog({ open: true, from, to });
  };

  const handleRemovePintFromHistory = (index: number) => {
    const key = `${historyDialog.from}->${historyDialog.to}`;
    const currentEntries = groupData.pints[key] || [];
    
    setGroupData((prev) => ({
      ...prev,
      pints: {
        ...prev.pints,
        [key]: currentEntries.filter((_, i) => i !== index),
      },
    }));

    toast({
      title: "Pint removed",
      description: "Removed from history",
    });
  };

  const handleAddMember = () => {
    const trimmed = newMemberName.trim();
    if (trimmed && !groupData.members.includes(trimmed)) {
      setGroupData((prev) => ({
        ...prev,
        members: [...prev.members, trimmed],
      }));
      setNewMemberName("");
      setAddMemberDialog(false);
      toast({
        title: "Member added!",
        description: `${trimmed} joined the group`,
      });
    }
  };

  const handleRemoveMember = (member: string) => {
    if (groupData.members.length <= 2) {
      toast({
        title: "Cannot remove",
        description: "Need at least 2 members",
        variant: "destructive",
      });
      return;
    }

    // Remove member and clean up their pints
    const newPints = { ...groupData.pints };
    Object.keys(newPints).forEach((key) => {
      if (key.includes(member)) {
        delete newPints[key];
      }
    });

    setGroupData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m !== member),
      pints: newPints,
    }));

    toast({
      title: "Member removed",
      description: `${member} left the group`,
    });
  };

  const handleUpdateGroupName = () => {
    const trimmed = newGroupName.trim();
    if (trimmed) {
      setGroupData((prev) => ({ ...prev, groupName: trimmed }));
      setNewGroupName("");
      setSettingsDialog(false);
      toast({
        title: "Group renamed!",
        description: `Now called "${trimmed}"`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GroupHeader
        groupName={groupData.groupName}
        onAddMember={() => setAddMemberDialog(true)}
        onSettings={() => {
          setNewGroupName(groupData.groupName);
          setSettingsDialog(true);
        }}
      />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Matrix Section */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-1">Who Owes Who?</h2>
            <p className="text-sm text-muted-foreground">
              Track pints between your mates
            </p>
          </div>
          <PintMatrix
            members={groupData.members}
            pints={groupData.pints}
            onAddPint={handleAddPint}
            onClearPint={handleClearPint}
            onViewHistory={handleViewHistory}
          />
        </section>

        {/* Tally Section */}
        <section>
          <TallySection members={groupData.members} pints={groupData.pints} />
        </section>
      </main>

      {/* Add Pint Dialog */}
      <AddPintDialog
        open={addPintDialog.open}
        onClose={() => setAddPintDialog({ open: false, from: "", to: "" })}
        fromMember={addPintDialog.from}
        toMember={addPintDialog.to}
        onConfirm={confirmAddPint}
      />

      {/* History Dialog */}
      <PintHistoryDialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false, from: "", to: "" })}
        fromMember={historyDialog.from}
        toMember={historyDialog.to}
        pints={groupData.pints[`${historyDialog.from}->${historyDialog.to}`] || []}
        onRemovePint={handleRemovePintFromHistory}
      />

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialog} onOpenChange={setAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Add Member
            </DialogTitle>
            <DialogDescription>
              Add a new friend to the group
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="member-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="member-name"
              placeholder="e.g., Dave"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddMember();
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={!newMemberName.trim()}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Manage your group name and members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Group Name */}
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
                disabled={!newGroupName.trim() || newGroupName === groupData.groupName}
              >
                Update Name
              </Button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Members</label>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {groupData.members.map((member) => (
                  <div
                    key={member}
                    className="flex items-center justify-between p-2 bg-secondary/50 rounded"
                  >
                    <span className="text-sm">{member}</span>
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

export default Index;
