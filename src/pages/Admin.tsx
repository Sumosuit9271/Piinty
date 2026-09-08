import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DailyPoint {
  day: string;
  users: number;
  groups: number;
}

interface Signup {
  joined_at: string;
  display_name: string;
}

interface Stats {
  total_users: number;
  total_groups: number;
  total_memberships: number;
  users_today: number;
  users_7d: number;
  users_30d: number;
  groups_today: number;
  groups_7d: number;
  groups_30d: number;
  daily: DailyPoint[];
  recent_signups: Signup[];
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="glass-card rounded-2xl p-4">
    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
      {label}
    </p>
    <p className="font-display text-3xl mt-1">{value}</p>
  </div>
);

const Chart = ({
  title,
  data,
  dataKey,
}: {
  title: string;
  data: DailyPoint[];
  dataKey: "users" | "groups";
}) => (
  <div className="glass-card rounded-2xl p-4">
    <h2 className="font-display text-lg mb-3">{title}</h2>
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase.rpc("admin_growth_stats");
    if (error || !data) {
      navigate("/groups");
      return;
    }

    setStats(data as unknown as Stats);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-2 max-w-4xl">
          <Button variant="ghost" size="icon" onClick={() => navigate("/groups")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-display text-xl">Dashboard</h1>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Piinty growth
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total users" value={stats.total_users} />
          <StatCard label="Total groups" value={stats.total_groups} />
          <StatCard label="Memberships" value={stats.total_memberships} />
          <StatCard label="Users today" value={stats.users_today} />
          <StatCard label="Users 7 days" value={stats.users_7d} />
          <StatCard label="Users 30 days" value={stats.users_30d} />
          <StatCard label="Groups 7 days" value={stats.groups_7d} />
          <StatCard label="Groups 30 days" value={stats.groups_30d} />
        </section>

        <Chart title="Sign-ups per day (30 days)" data={stats.daily} dataKey="users" />
        <Chart title="Groups created per day (30 days)" data={stats.daily} dataKey="groups" />

        <section className="glass-card rounded-2xl p-4">
          <h2 className="font-display text-lg mb-3">Latest sign-ups</h2>
          {stats.recent_signups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sign-ups yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {stats.recent_signups.map((s, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span>{s.display_name}</span>
                  <span className="text-muted-foreground">{s.joined_at}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admin;
