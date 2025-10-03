import { PintEntry } from "@/types/pint";
import { Crown, CircleSlash } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LeaderboardProps {
  members: string[];
  pints: Record<string, PintEntry[]>;
}

export function Leaderboard({ members, pints }: LeaderboardProps) {
  // Calculate stats for each member
  const memberStats = members.map((member) => {
    let owedTo = 0; // Pints this member is owed (receiving)
    let owes = 0; // Pints this member owes (giving)

    Object.entries(pints).forEach(([key, entries]) => {
      const [from, to] = key.split("->");
      const unpaidCount = entries.filter((e) => !e.paid).length;

      if (to === member) {
        owedTo += unpaidCount;
      }
      if (from === member) {
        owes += unpaidCount;
      }
    });

    return { member, owedTo, owes };
  });

  // Find the king (most pints owed TO them)
  const king = memberStats.reduce((max, current) =>
    current.owedTo > max.owedTo ? current : max
  );

  // Find the clown (most pints they OWE)
  const clown = memberStats.reduce((max, current) =>
    current.owes > max.owes ? current : max
  );

  // Only show if there are actual pints
  const hasData = king.owedTo > 0 || clown.owes > 0;

  if (!hasData) {
    return null;
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-1">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          The heroes and the legends
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* The King */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary mb-1">The King</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Most pints owed to them
              </p>
              <div className="text-2xl font-bold">{king.member}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {king.owedTo} {king.owedTo === 1 ? "pint" : "pints"}
              </div>
            </div>
          </div>
        </Card>

        {/* The Clown */}
        <Card className="p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-destructive/20 rounded-full">
              <CircleSlash className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-destructive mb-1">
                The Clown
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Most pints they owe
              </p>
              <div className="text-2xl font-bold">{clown.member}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {clown.owes} {clown.owes === 1 ? "pint" : "pints"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
