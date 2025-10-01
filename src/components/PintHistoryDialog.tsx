import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PintEntry } from "@/types/pint";
import { Beer, Calendar, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PintHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  fromMember: string;
  toMember: string;
  pints: PintEntry[];
  onRemovePint: (index: number) => void;
}

export function PintHistoryDialog({
  open,
  onClose,
  fromMember,
  toMember,
  pints,
  onRemovePint,
}: PintHistoryDialogProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beer className="h-5 w-5 text-primary" />
            Pint History
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{fromMember}</span> owes{" "}
            <span className="font-medium text-foreground">{toMember}</span>
          </DialogDescription>
        </DialogHeader>

        {pints.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No pints owed
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {pints.map((pint, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg group"
                >
                  <Beer className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {pint.note || "No reason given"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(pint.timestamp)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemovePint(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm font-medium">
            Total: {pints.length} {pints.length === 1 ? "pint" : "pints"}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
