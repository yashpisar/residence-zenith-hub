import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Banknote, ClipboardList, DoorOpen, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { categorySplit, collectionTrend, complaintTrend, visitorFlow } from "@/lib/mock-data";
import { chartTheme, tooltipStyle } from "@/lib/chart-theme";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Havenly Estates" },
      {
        name: "description",
        content:
          "Society analytics on complaint resolution, maintenance collection, visitor flow and staff performance.",
      },
      { property: "og:title", content: "Analytics — Havenly Estates" },
      { property: "og:description", content: "Complaint, collection and visitor analytics." },
    ],
  }),
  component: Analytics,
});

const spark = (s) => Array.from({ length: 8 }, (_, i) => ({ v: 18 + Math.sin(i + s) * 6 + i * 2 }));

function Analytics() {
  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Analytics"
        description="Operational performance across complaints, finance and gate security."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tickets closed"
          value={318}
          change={14}
          icon={ClipboardList}
          trend={spark(1)}
          index={0}
        />
        <StatCard
          label="Collection rate"
          value={92}
          suffix="%"
          change={4}
          icon={Banknote}
          tone="success"
          trend={spark(2)}
          index={1}
        />
        <StatCard
          label="Visitors logged"
          value={4820}
          change={9}
          icon={DoorOpen}
          tone="info"
          trend={spark(3)}
          index={2}
        />
        <StatCard
          label="Active residents"
          value={1042}
          change={2}
          icon={Users}
          tone="amber"
          trend={spark(4)}
          index={3}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <SurfaceCard title="Resolution throughput" description="Raised vs resolved per month">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="raised"
                  stroke="var(--color-chart-1)"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="var(--color-chart-4)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Maintenance collection" description="Collected vs outstanding dues (₹)">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v) => `${v / 100000}L`}
                />

                <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.7 0 0 / 0.06)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="collected" fill="var(--color-chart-1)" radius={[10, 10, 4, 4]} />
                <Bar dataKey="dues" fill="var(--color-chart-3)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Complaint mix" description="Distribution by category">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Pie
                  data={categorySplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={96}
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

        <SurfaceCard title="Gate traffic" description="Visitors by hour of day">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorFlow}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="hour"
                  stroke={chartTheme.axis}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.7 0 0 / 0.06)" }} />
                <Bar dataKey="visitors" fill="var(--color-chart-2)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>
    </>
  );
}
