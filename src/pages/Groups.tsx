import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Users, LogOut, ChevronRight, Camera, X, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import piintyLogo from "@/assets/piinty-logo.png";

interface Group {
  id: string;
  name: string;
  created_at: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [userDisplayName, setUserDisplayName] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadGroups();
  }, []);

  useEffect(() => {
    // Set up auto-logout on browser close if "Remember me" was unchecked
    const shouldAutoLogout = sessionStorage.getItem("autoLogout") === "true";
    if (shouldAutoLogout) {
      const handleBeforeUnload = async () => {
        await supabase.auth.signOut();
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, []);

  const checkAuthAndLoadGroups = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Load user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", session.user.id)
      .single();

    if (profile) {
      setUserDisplayName(profile.display_name);
      setUserAvatarUrl(profile.avatar_url);
    }

    loadGroups();
  };

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading groups",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    const trimmed = newDisplayName.trim();
    if (!trimmed || !userId) return;

    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("id", userId);

      if (error) throw error;

      setUserDisplayName(trimmed);
      setNameDialogOpen(false);
      toast({ title: "Name updated", description: `You're now ${trimmed}` });
    } catch (error: any) {
      toast({
        title: "Couldn't update name",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: newGroupName.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
        });

      if (memberError) throw memberError;

      toast({
        title: "Group created!",
        description: `${newGroupName} is ready`,
      });

      setNewGroupName("");
      setCreateDialogOpen(false);
      loadGroups();
    } catch (error: any) {
      toast({
        title: "Error creating group",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUserAvatarUrl(publicUrl);
      toast({
        title: "Picture updated!",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading picture",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      setUserAvatarUrl(null);
      toast({
        title: "Picture removed",
        description: "Your profile picture has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error removing picture",
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-3xl">

          <div className="flex items-center gap-3">
            <img src={piintyLogo} alt="Piinty Logo" className="h-12 w-auto" />
            <div className="flex items-center gap-2">
              <div 
                className="relative cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userAvatarUrl || undefined} alt={userDisplayName} />
                  <AvatarFallback>{userDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium">{userDisplayName}</p>
                  <button
                    onClick={() => {
                      setNewDisplayName(userDisplayName);
                      setNameDialogOpen(true);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Change your name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {userAvatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove picture
                  </button>
                )}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
            <div className="rounded-full bg-primary/10 p-6 mb-5 amber-glow">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-display text-2xl mb-2">No crews yet</h2>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              Start a group and settle the rounds
            </p>
            <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create group
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="p-4 rounded-2xl glass-card cursor-pointer pint-hover animate-fade-up"
                onClick={() => navigate(`/group/${group.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                      <Users className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg leading-tight">{group.name}</h3>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        Open the slate
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>


      {/* Floating Action Button */}
      {groups.length > 0 && (
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Create New Group
            </DialogTitle>
            <DialogDescription>
              Give your group a name to get started
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="group-name" className="text-sm font-medium">
              Group Name
            </label>
            <Input
              id="group-name"
              placeholder="e.g., Friday Pub Crew"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              maxLength={50}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
              }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
