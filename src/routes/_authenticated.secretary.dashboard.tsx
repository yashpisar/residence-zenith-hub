import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  Banknote,
  Building2,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import {
  activityFeed,
  collectionTrend,
  complaints,
  complaintTrend,
} from "@/lib/mock-data";
import { chartTheme, tooltipStyle } from "@/lib/chart-theme";

export const Route = createFileRoute("/_authenticated/secretary/dashboard")({
  component: SecretaryDashboard,
});

const spark = (seed: number) =>
  Array.from({ length: 8 }, (_, i) => ({ v: Math.round(20 + Math.sin(i + seed) * 8 + i * 2.4) }));

function SecretaryDashboard() {
  const { user } = useAuth();
  const { selectedSociety } = useSociety();

  const stats = [
    { label: "Active complaints", value: 42, change: -9, icon: ClipboardList, tone: "info" as const },
    { label: "Collection this month (₹)", value: 2185000, change: 11, icon: Banknote, tone: "success" as const },
    { label: "Occupied flats", value: 386, change: 2, icon: Building2, tone: "primary" as const },
    { label: "Staff on duty", value: 24, change: -4, icon: Users, tone: "amber" as const },
  ];

  return (
    <>
      <PageHeader
        icon={Building2}
        title={`Good evening, ${user?.name || "Secretary"}`}
        description={`Secretary workspace · ${selectedSociety?.name || "Society"}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documents">Documents</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/announcements">
                New notice <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            index={i}
            label={s.label}
            value={s.value}
            change={s.change}
            icon={s.icon}
            tone={s.tone}
            trend={spark(i)}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SurfaceCard
          className="xl:col-span-2"
          title="Complaints raised vs resolved"
          description="Society wide reporting"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={complaintTrend}>
                <defs>
                  <linearGradient id="gRaised" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Area type="monotone" dataKey="raised" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#gRaised)" />
                <Area type="monotone" dataKey="resolved" stroke="var(--color-chart-2)" strokeWidth={2.5} fill="url(#gResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Live activity" description="Realtime society events">
          <ul className="space-y-4">
            {activityFeed.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span
                  className="mt-1.5 size-2.5 shrink-0 rounded-full ring-4"
                  style={{
                    background: `var(--${a.tone === "danger" ? "destructive" : a.tone})`,
                    boxShadow: "none",
                    color: "transparent",
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.detail}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground/80">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SurfaceCard
          className="xl:col-span-2"
          title="Latest complaints"
          description="Updated in real time"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to="/complaints">View all</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {complaints.slice(0, 5).map((c) => (
              <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.id} · {c.category} · Flat {c.flat} · {c.updated}
                  </p>
                </div>
                <StatusBadge value={c.status} />
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard
          title="Collection vs dues"
          description="Monthly maintenance in ₹"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v: number) => `${v / 100000}L`}
                />
                <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.7 0 0 / 0.06)" }} />
                <Bar dataKey="collected" fill="var(--color-chart-1)" radius={[10, 10, 4, 4]} />
                <Bar dataKey="dues" fill="var(--color-chart-3)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
