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

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* Helper text */}
        <div className="mb-4 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
          <strong>How to read:</strong> Row (left) owes Column (top). Click a cell to see history.
        </div>

        {/* Header row with member names (receivers) */}
        <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `120px repeat(${members.length}, minmax(140px, 1fr))` }}>
          <div className="p-3"></div>
          {members.map((member) => (
            <div
              key={member}
              className="p-3 flex flex-col items-center justify-center gap-2 font-semibold text-sm bg-secondary rounded-lg"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={memberAvatars[member] || undefined} alt={member} />
                <AvatarFallback className="text-xs">{member.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div>{member}</div>
                <div className="text-xs font-normal text-muted-foreground mt-0.5">is owed</div>
              </div>
            </div>
          ))}
        </div>

        {/* Matrix grid */}
        {members.map((fromMember) => (
          <div
            key={fromMember}
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `120px repeat(${members.length}, minmax(140px, 1fr))` }}
          >
            {/* Row label (givers) */}
            <div className="p-3 flex flex-col items-center justify-center gap-2 font-semibold text-sm bg-secondary rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={memberAvatars[fromMember] || undefined} alt={fromMember} />
                <AvatarFallback className="text-xs">{fromMember.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div>{fromMember}</div>
                <div className="text-xs font-normal text-muted-foreground mt-0.5">owes</div>
              </div>
            </div>

            {/* Cells */}
            {members.map((toMember) => {
              const key = getPintKey(fromMember, toMember);
              const entries = pints[key] || [];
              const count = entries.filter(e => !e.paid).length;

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
  );
}
