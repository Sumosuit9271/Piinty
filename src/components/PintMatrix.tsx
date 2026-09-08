import { PintCell } from "./PintCell";
import { PintEntry } from "@/types/pint";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface PintMatrixProps {
  members: string[];
  memberAvatars: Record<string, string | null>;
  pints: Record<string, PintEntry[]>;
  onAddPint: (from: string, to: string) => void;
  onClearPint: (from: string, to: string) => void;
  onViewHistory: (from: string, to: string) => void;
}

export function PintMatrix({ members, memberAvatars, pints, onAddPint, onClearPint, onViewHistory }: PintMatrixProps) {
  const getPintKey = (from: string, to: string) => `${from}->${to}`;
  const columns = `104px repeat(${members.length}, minmax(150px, 1fr))`;

  return (
    <div className="rounded-3xl glass-card p-3 sm:p-4">
      <p className="text-xs text-muted-foreground mb-3 px-1">
        <span className="text-foreground font-semibold">Row owes column.</span> Tap a number to see the story behind it.
      </p>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-max">
          {/* Header row (receivers) */}
          <div className="grid gap-2 mb-2 sticky top-0 z-20" style={{ gridTemplateColumns: columns }}>
            <div className="sticky left-0 z-30 bg-card/90 backdrop-blur-xl rounded-2xl" />
            {members.map((member) => (
              <div
                key={member}
                className="p-3 flex flex-col items-center justify-center gap-2 bg-card/90 backdrop-blur-xl rounded-2xl border border-border/60"
              >
                <Avatar className="h-14 w-14 ring-2 ring-primary/40">
                  <AvatarImage src={memberAvatars[member] || undefined} alt={member} />
                  <AvatarFallback className="text-sm bg-secondary">{member.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="text-xs font-semibold truncate max-w-[120px]">{member}</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-primary/80 mt-0.5">is owed</div>
                </div>
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {members.map((fromMember) => (
            <div key={fromMember} className="grid gap-2 mb-2" style={{ gridTemplateColumns: columns }}>
              <div className="sticky left-0 z-10 p-3 flex flex-col items-center justify-center gap-2 bg-card/90 backdrop-blur-xl rounded-2xl border border-border/60">
                <Avatar className="h-14 w-14 ring-2 ring-destructive/40">
                  <AvatarImage src={memberAvatars[fromMember] || undefined} alt={fromMember} />
                  <AvatarFallback className="text-sm bg-secondary">{fromMember.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <div className="text-xs font-semibold truncate max-w-[92px]">{fromMember}</div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-destructive/80 mt-0.5">owes</div>
                </div>
              </div>

              {members.map((toMember) => {
                const key = getPintKey(fromMember, toMember);
                const entries = pints[key] || [];
                const count = entries.filter((e) => !e.paid).length;

                return (
                  <PintCell
                    key={key}
                    fromMember={fromMember}
                    toMember={toMember}
                    count={count}
                    onAddPint={onAddPint}
                    onClearPint={onClearPint}
                    onViewHistory={onViewHistory}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
