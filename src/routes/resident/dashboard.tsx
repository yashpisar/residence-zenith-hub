import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  DoorOpen,
  ShieldCheck,
  Wallet,
  Building2,
  Wrench,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
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
  categorySplit,
  complaints,
  complaintTrend,
} from "@/lib/mock-data";
import { chartTheme, tooltipStyle } from "@/lib/chart-theme";

export const Route = createFileRoute("/resident/dashboard")({
  component: ResidentDashboard,
});

const spark = (seed: number) =>
  Array.from({ length: 8 }, (_, i) => ({ v: Math.round(20 + Math.sin(i + seed) * 8 + i * 2.4) }));

function ResidentDashboard() {
  const { user } = useAuth();
  const { selectedSociety } = useSociety();

  const stats = [
    { label: "Open complaints", value: 3, change: -25, icon: ClipboardList, tone: "info" as const },
    { label: "Maintenance due (₹)", value: 4800, change: 0, icon: Wallet, tone: "amber" as const },
    { label: "Visitors this month", value: 27, change: 12, icon: DoorOpen, tone: "primary" as const },
    { label: "Pending approvals", value: 2, change: 8, icon: ShieldCheck, tone: "destructive" as const },
  ];

  return (
    <>
      <PageHeader
        icon={Building2}
        title={`Good evening, ${user?.name || "Resident"}`}
        description={`Resident workspace · ${selectedSociety?.name || "Society"} · Flat ${user?.flatNumber || "A-402"}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documents">Documents</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/complaints/new">
                New complaint <ArrowRight />
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
          description="Last 6 reporting periods"
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

        <SurfaceCard title="Complaint categories" description="Share of total tickets">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Pie
                  data={categorySplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                  stroke="none"
                >
                  {categorySplit.map((_, i) => (
                    <Cell key={i} fill={`var(--color-chart-${i + 1})`} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Wrench, title: "Maintenance", stat: "₹4,800 due", desc: "July billing cycle is pending.", to: "/maintenance" },
          { icon: DoorOpen, title: "Gate security", stat: "27 entries", desc: "You have approved 27 visitors this month.", to: "/visitor-approval" },
        ].map((c) => (
          <article key={c.title} className="surface-card lift-on-hover p-5">
            <div className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10">
              <c.icon className="size-6 text-primary" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
            <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{c.stat}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
              <Link to={c.to}>Open module <ArrowRight /></Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
