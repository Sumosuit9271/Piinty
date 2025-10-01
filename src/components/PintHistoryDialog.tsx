import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PintEntry } from "@/types/pint";
import { Beer, Calendar, Circle, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PintHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  fromMember: string;
  toMember: string;
  pints: PintEntry[];
  onTogglePaid: (index: number) => void;
}

export function PintHistoryDialog({
  open,
  onClose,
  fromMember,
  toMember,
  pints,
  onTogglePaid,
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

  // Safety check: ensure pints is always an array
  const safePints = Array.isArray(pints) ? pints : [];
  const unpaidCount = safePints.filter(p => !p.paid).length;
  const paidCount = safePints.filter(p => p.paid).length;

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

        {safePints.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No pints owed
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-2">
              {safePints.map((pint, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg group pint-transition ${
                    pint.paid 
                      ? "bg-accent/10 opacity-60" 
                      : "bg-secondary/50"
                  }`}
                >
                  <Beer className={`h-4 w-4 mt-1 flex-shrink-0 ${pint.paid ? "text-accent" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${pint.paid ? "line-through" : ""}`}>
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
                    className="h-7 w-7 hover:bg-accent/20 pint-transition"
                    onClick={() => onTogglePaid(index)}
                    title={pint.paid ? "Mark as unpaid" : "Mark as paid"}
                  >
                    {pint.paid ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm space-y-1">
            <div className="font-medium">
              Unpaid: {unpaidCount} {unpaidCount === 1 ? "pint" : "pints"}
            </div>
            {paidCount > 0 && (
              <div className="text-xs text-muted-foreground">
                Paid: {paidCount}
              </div>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
