import { TrendingUp } from "lucide-react";
import { PintEntry } from "@/types/pint";

interface TallySectionProps {
  members: string[];
  pints: Record<string, PintEntry[]>;
}

export function TallySection({ members, pints }: TallySectionProps) {
  // Calculate who owes the most
  const calculateTallies = () => {
    const tallies: Record<string, number> = {};
    
    members.forEach((member) => {
      tallies[member] = 0;
    });

    Object.entries(pints).forEach(([key, entries]) => {
      const [from] = key.split("->");
      if (tallies[from] !== undefined) {
        tallies[from] += entries.filter(e => !e.paid).length;
      }
    });

    return tallies;
  };

  const tallies = calculateTallies();
  const sortedMembers = [...members].sort((a, b) => tallies[b] - tallies[a]);
  const topDebtor = sortedMembers[0];
  const topCount = tallies[topDebtor];

  if (topCount === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="text-muted-foreground">No pints owed yet. Get a round in.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl">The Slate</h2>
      </div>

      <div className="space-y-2">
        {sortedMembers.map((member, index) => {
          const count = tallies[member];
          if (count === 0) return null;

          return (
            <div
              key={member}
              className="flex items-center justify-between p-3 rounded-2xl bg-secondary/40 border border-border/50 pint-transition hover:bg-secondary/70"
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-lg text-primary/70 w-7 tabular">
                  {index + 1}
                </span>
                <span className="font-medium">{member}</span>
              </div>
              <span className="font-display text-lg text-primary tabular">
                {count} <span className="text-xs text-muted-foreground font-sans">{count === 1 ? "pint" : "pints"}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

