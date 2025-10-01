import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Beer } from "lucide-react";

interface AddPintDialogProps {
  open: boolean;
  onClose: () => void;
  fromMember: string;
  toMember: string;
  onConfirm: (note: string) => void;
}

export function AddPintDialog({
  open,
  onClose,
  fromMember,
  toMember,
  onConfirm,
}: AddPintDialogProps) {
  const [note, setNote] = useState("");

  const handleConfirm = () => {
    onConfirm(note);
    setNote("");
    onClose();
  };

  const handleCancel = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beer className="h-5 w-5 text-primary" />
            Add a Pint
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{fromMember}</span> owes{" "}
            <span className="font-medium text-foreground">{toMember}</span> a pint
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label htmlFor="note" className="text-sm font-medium">
            Reason (optional)
          </label>
          <Input
            id="note"
            placeholder="e.g., Lost the bet..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="add" onClick={handleConfirm}>
            Add Pint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
