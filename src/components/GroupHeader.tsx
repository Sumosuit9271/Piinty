import { Settings, UserPlus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRef } from "react";
import piintyLogo from "@/assets/piinty-logo.png";

interface GroupHeaderProps {
  groupName: string;
  groupAvatarUrl?: string | null;
  groupId: string;
  onAddMember: () => void;
  onSettings: () => void;
  onAvatarUpdate: (url: string | null) => void;
}

export function GroupHeader({ groupName, groupAvatarUrl, groupId, onAddMember, onSettings, onAvatarUpdate }: GroupHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      const filePath = `groups/${groupId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('groups')
        .update({ avatar_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      toast({
        title: "Group picture updated!",
        description: "The group picture has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading picture",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('groups')
        .update({ avatar_url: null })
        .eq('id', groupId);

      if (error) throw error;

      onAvatarUpdate(null);
      toast({
        title: "Group picture removed",
        description: "The group picture has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error removing picture",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="relative cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={groupAvatarUrl || undefined} alt={groupName} />
                <AvatarFallback className="text-lg">{groupName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5">
                <Camera className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{groupName}</h1>
              <p className="text-sm text-muted-foreground">Keep track of owed pints between mates!</p>
              {groupAvatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-xs text-destructive hover:underline mt-0.5"
                >
                  Remove picture
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onAddMember}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Member</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </header>
  );
}
