import { PintEntry } from "@/types/pint";
import { Crown, CircleSlash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface LeaderboardProps {
  members: string[];
  memberAvatars: Record<string, string | null>;
  pints: Record<string, PintEntry[]>;
}

export function Leaderboard({ members, memberAvatars, pints }: LeaderboardProps) {
  // Calculate stats for each member
  const memberStats = members.map((member) => {
    let owedTo = 0; // Pints this member is owed (receiving) - unpaid
    let owes = 0; // Pints this member owes (giving) - unpaid
    let totalOwedTo = 0; // Total pints ever owed to this member
    let totalOwes = 0; // Total pints this member has ever owed

    Object.entries(pints).forEach(([key, entries]) => {
      const [from, to] = key.split("->");
      const unpaidCount = entries.filter((e) => !e.paid).length;
      const totalCount = entries.length;

      if (to === member) {
        owedTo += unpaidCount;
        totalOwedTo += totalCount;
      }
      if (from === member) {
        owes += unpaidCount;
        totalOwes += totalCount;
      }
    });

    return { member, owedTo, owes, totalOwedTo, totalOwes };
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
    <section className="animate-fade-up">
      <div className="mb-4">
        <h2 className="font-display text-2xl">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">The heroes and the legends</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pint Pappy */}
        <Card className="relative overflow-hidden p-6 rounded-3xl glass-card border-primary/25">
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary shadow-glow">
                <AvatarImage src={memberAvatars[king.member] || undefined} alt={king.member} />
                <AvatarFallback className="bg-secondary">{king.member.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 -left-2 rotate-[-18deg] rounded-full bg-primary p-1.5 shadow-glow">
                <Crown className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary mb-1">Pint Pappy</div>
              <div className="font-display text-2xl truncate">{king.member}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-3xl text-primary tabular">{king.owedTo}</span>
                <span className="text-xs text-muted-foreground">
                  {king.owedTo === 1 ? "pint" : "pints"} owed to them
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                {king.totalOwedTo} all time
              </div>
            </div>
          </div>
        </Card>

        {/* Roundling */}
        <Card className="relative overflow-hidden p-6 rounded-3xl glass-card border-destructive/25">
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-destructive/20 blur-3xl" />
          <div className="relative flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-destructive">
                <AvatarImage src={memberAvatars[clown.member] || undefined} alt={clown.member} />
                <AvatarFallback className="bg-secondary">{clown.member.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 -left-2 rotate-[-18deg] rounded-full bg-destructive p-1.5">
                <CircleSlash className="h-4 w-4 text-destructive-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-destructive mb-1">Roundling</div>
              <div className="font-display text-2xl truncate">{clown.member}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-3xl text-destructive tabular">{clown.owes}</span>
                <span className="text-xs text-muted-foreground">
                  {clown.owes === 1 ? "pint" : "pints"} to buy back
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                {clown.totalOwes} all time
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}

