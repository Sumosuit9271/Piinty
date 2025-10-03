import { Settings, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import piintyLogo from "@/assets/piinty-logo.png";

interface GroupHeaderProps {
  groupName: string;
  onAddMember: () => void;
  onSettings: () => void;
}

export function GroupHeader({ groupName, onAddMember, onSettings }: GroupHeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={piintyLogo} alt="Piinty Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold">{groupName}</h1>
              <p className="text-sm text-muted-foreground">Keep track of owed pints between mates!</p>
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
    </header>
  );
}
