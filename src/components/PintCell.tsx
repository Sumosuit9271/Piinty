import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PintCellProps {
  fromMember: string;
  toMember: string;
  count: number;
  onAddPint: (from: string, to: string) => void;
  onClearPint: (from: string, to: string) => void;
  onViewHistory: (from: string, to: string) => void;
}

export function PintCell({ fromMember, toMember, count, onAddPint, onClearPint, onViewHistory }: PintCellProps) {
  // Don't show cell for same person
  if (fromMember === toMember) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-center min-h-[100px]">
        <span className="text-muted-foreground text-sm">—</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-card rounded-lg border border-border pint-transition hover:shadow-sm min-h-[100px] flex flex-col justify-between gap-2">
      <button
        onClick={() => onViewHistory(fromMember, toMember)}
        className="text-center hover:bg-secondary/50 rounded p-2 pint-transition"
      >
        <div className="text-2xl font-bold text-primary">{count || "—"}</div>
        <div className="text-xs text-muted-foreground">
          {count === 1 ? "pint" : "pints"}
        </div>
        {count > 0 && (
          <div className="text-xs text-primary/70 mt-1">
            View history
          </div>
        )}
      </button>
      
      <div className="flex gap-1.5">
        <Button
          variant="add"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onAddPint(fromMember, toMember)}
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
        <Button
          variant="clear"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onClearPint(fromMember, toMember)}
          disabled={count === 0}
        >
          <Minus className="h-3 w-3" />
          Clear
        </Button>
      </div>
    </div>
  );
}
