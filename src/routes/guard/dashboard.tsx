import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  DoorOpen,
  Package,
  ShieldCheck,
  Building2,
  Users,
  QrCode,
  Clock,
  Car
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend
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
  visitorFlow,
  visitors,
} from "@/lib/mock-data";
import { chartTheme, tooltipStyle } from "@/lib/chart-theme";
import { EmergencyFAB } from "@/components/guard/EmergencyFAB";

export const Route = createFileRoute("/guard/dashboard")({
  component: GuardDashboard,
});

const spark = (seed: number) =>
  Array.from({ length: 8 }, (_, i) => ({ v: Math.round(20 + Math.sin(i + seed) * 8 + i * 2.4) }));

function GuardDashboard() {
  const { user } = useAuth();
  const { selectedSociety } = useSociety();

  const stats = [
    { label: "Visitors Today", value: 42, change: 12, icon: Users, tone: "primary" as const },
    { label: "Inside Society", value: 18, change: 6, icon: DoorOpen, tone: "info" as const },
    { label: "Expected Visitors", value: 5, change: -2, icon: Clock, tone: "amber" as const },
    { label: "Deliveries Today", value: 24, change: 4, icon: Package, tone: "success" as const },
  ];

  const categorySplit = [
    { name: "Guests", value: 45 },
    { name: "Delivery", value: 35 },
    { name: "Service", value: 15 },
    { name: "Staff", value: 5 },
  ];

  return (
    <>
      <PageHeader
        icon={Building2}
        title={`Good evening, ${user?.name || "Gate Security"}`}
        description={`Security workspace · ${selectedSociety?.name || "Society"}`}
        actions={
          <Button size="sm" asChild>
            <Link to="/visitors/new">
              Log visitor <ArrowRight />
            </Link>
          </Button>
        }
      />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <Link to="/visitors/new" className="col-span-1">
          <SurfaceCard className="h-full flex flex-col items-center justify-center p-6 text-center hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="bg-primary/10 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Users className="size-6 text-primary" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">Add Visitor</h3>
            <p className="text-xs text-muted-foreground mt-1">Manual entry</p>
          </SurfaceCard>
        </Link>
        <Link to="/qr-scanner" className="col-span-1">
          <SurfaceCard className="h-full flex flex-col items-center justify-center p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer group">
            <div className="bg-blue-500/10 p-4 rounded-full group-hover:scale-110 transition-transform">
              <QrCode className="size-6 text-blue-500" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">Scan Pass</h3>
            <p className="text-xs text-muted-foreground mt-1">QR validation</p>
          </SurfaceCard>
        </Link>
        <Link to="/visitors/new" search={{ type: "delivery" }} className="col-span-1">
          <SurfaceCard className="h-full flex flex-col items-center justify-center p-6 text-center hover:border-amber-500/50 transition-colors cursor-pointer group">
            <div className="bg-amber-500/10 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Package className="size-6 text-amber-500" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">Delivery</h3>
            <p className="text-xs text-muted-foreground mt-1">Quick entry</p>
          </SurfaceCard>
        </Link>
        <Link to="/visitors/history" className="col-span-1">
          <SurfaceCard className="h-full flex flex-col items-center justify-center p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer group">
            <div className="bg-purple-500/10 p-4 rounded-full group-hover:scale-110 transition-transform">
              <Car className="size-6 text-purple-500" />
            </div>
            <h3 className="mt-3 font-semibold text-foreground">History</h3>
            <p className="text-xs text-muted-foreground mt-1">All logs</p>
          </SurfaceCard>
        </Link>
      </div>

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
          title="Hourly Visitor Flow"
          description="Entries throughout the day"
        >
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorFlow}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="hour" stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.7 0 0 / 0.06)" }} />
                <Bar dataKey="visitors" fill="var(--color-chart-1)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Visitor Categories" description="Share of total entries">
          <div className="h-[300px] w-full">
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

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SurfaceCard
          className="xl:col-span-2"
          title="Recent Gate Entries"
          description="Updated in real time"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link to="/visitors/history">View all</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {visitors.map((v) => (
              <li key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                <div className="min-w-0 flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${v.name}&background=random`} alt={v.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="truncate text-sm font-semibold text-foreground">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.purpose} · Flat {v.flat} · In {v.entry}
                    </p>
                  </div>
                </div>
                <StatusBadge value={v.status} />
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Live Alerts" description="Realtime society events">
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
      
      <EmergencyFAB />
    </>
  );
}
