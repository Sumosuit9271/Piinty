import { Plus, Check } from "lucide-react";
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
      <div className="rounded-2xl bg-secondary/20 border border-dashed border-border/60 flex items-center justify-center min-h-[124px]">
        <span className="text-muted-foreground/50 text-lg">—</span>
      </div>
    );
  }

  const intensity = Math.min(count, 5);
  const tint = count > 0 ? `hsl(var(--primary) / ${0.06 + intensity * 0.045})` : undefined;

  return (
    <div
      className="p-3 rounded-2xl glass-card min-h-[124px] flex flex-col justify-between gap-2 pint-transition hover:border-primary/40"
      style={tint ? { background: tint } : undefined}
    >
      <button
        onClick={() => onViewHistory(fromMember, toMember)}
        className="text-center rounded-xl py-1 pint-transition hover:bg-foreground/5"
      >
        <div
          key={count}
          className={`font-display text-4xl leading-none tabular animate-pop-in ${
            count > 0 ? "text-primary" : "text-muted-foreground/40"
          }`}
        >
          {count || "–"}
        </div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1.5">
          {count === 1 ? "pint" : "pints"}
        </div>
      </button>

      <div className="flex gap-1.5">
        <Button
          variant="add"
          size="sm"
          className="flex-1 text-xs px-2"
          onClick={() => onAddPint(fromMember, toMember)}
        >
          <Plus className="h-3 w-3" />
          Pint
        </Button>
        <Button
          variant="clear"
          size="sm"
          className="flex-1 text-xs px-2"
          onClick={() => onClearPint(fromMember, toMember)}
          disabled={count === 0}
        >
          <Check className="h-3 w-3" />
          Paid
        </Button>
      </div>
    </div>
  );
}
