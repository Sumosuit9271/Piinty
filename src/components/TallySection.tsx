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
        tallies[from] += entries.length;
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
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground">No pints owed yet. Start tracking!</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Leaderboard</h2>
      </div>
      
      <div className="space-y-2">
        {sortedMembers.map((member, index) => {
          const count = tallies[member];
          if (count === 0) return null;
          
          return (
            <div key={member} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">
                  #{index + 1}
                </span>
                <span className="font-medium">{member}</span>
              </div>
              <span className="text-primary font-bold">
                {count} {count === 1 ? "pint" : "pints"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
