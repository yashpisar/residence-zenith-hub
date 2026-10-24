import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { complaintApi, communityApi } from "@/services/api";
import { ComplaintDetailsModal } from "@/components/complaints/ComplaintDetailsModal";
import {
  ArrowRight,
  ClipboardList,
  Banknote,
  Building2,
  Users,
  UserPlus,
  HardHat,
  Phone,
  Mail,
  Clock,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
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
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { activityFeed, collectionTrend, complaints, complaintTrend } from "@/lib/mock-data";
import { chartTheme, tooltipStyle } from "@/lib/chart-theme";

export const Route = createFileRoute("/_authenticated/secretary/dashboard")({
  component: SecretaryDashboard,
});

const spark = (seed) =>
  Array.from({ length: 8 }, (_, i) => ({ v: Math.round(20 + Math.sin(i + seed) * 8 + i * 2.4) }));

// ─── Role / shift options ──────────────────────────────────────────────────────
const ROLE_OPTIONS = ["Plumber", "Electrician", "Housekeeping", "Security Guard", "Supervisor", "Gardener", "Other"];
const SHIFT_OPTIONS = ["Morning", "Evening", "Night", "General"];
const STATUS_OPTIONS = ["On Duty", "Off Duty", "On Leave"];

function statusColor(status) {
  switch (status) {
    case "On Duty": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "Off Duty": return "bg-slate-500/15 text-slate-400 border-slate-500/30";
    case "On Leave": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "Terminated": return "bg-red-500/15 text-red-400 border-red-500/30";
    default: return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  }
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────
function AddStaffModal({ open, onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", role: "Plumber",
    shift: "General", status: "On Duty", assignedWing: "All",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setForm({ name: "", phone: "", email: "", role: "Plumber", shift: "General", status: "On Duty", assignedWing: "All" });
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Staff name is required"); return; }
    if (!form.phone.trim() || form.phone.trim().length < 8) { setError("Valid phone number is required (min 8 digits)"); return; }

    setSaving(true);
    try {
      const res = await communityApi.createStaff({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        role: form.role,
        shift: form.shift,
        status: form.status,
        assignedWing: form.assignedWing.trim() || "All",
      });
      setSuccess(true);
      onAdded(res?.data || res);
      setTimeout(() => { handleClose(); }, 1200);
    } catch (err) {
      setError(err?.message || "Failed to add staff member");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0F1923] border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-400" />
            <h2 className="font-bold text-white text-base">Add New Staff Member</h2>
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Full Name *</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Ramesh Pawar"
              className="h-9 text-sm"
            />
          </div>

          {/* Role + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Role / Specialization *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Phone Number *</label>
              <Input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9823001122"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Email + Wing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Email (Optional)</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="staff@society.com"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Assigned Wing / Area</label>
              <Input
                value={form.assignedWing}
                onChange={(e) => setForm({ ...form, assignedWing: e.target.value })}
                placeholder="All, Wing A, Gate 1"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Shift + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Working Shift</label>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SHIFT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Initial Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-2.5 text-sm text-red-400">
              <X className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />Staff member added and saved to database!
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5 bg-teal-600 hover:bg-teal-500 text-white">
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              {saving ? "Adding…" : "Add Staff Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
function SecretaryDashboard() {
  const { user } = useAuth();
  const { selectedSociety } = useSociety();

  const [latestComplaints, setLatestComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Staff state
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const loadLatestComplaints = async () => {
    try {
      const res = await complaintApi.getAll({ limit: 5 });
      const list = Array.isArray(res?.data) ? res.data : [];
      setLatestComplaints(list.length > 0 ? list : complaints.slice(0, 5));
    } catch {
      setLatestComplaints(complaints.slice(0, 5));
    }
  };

  const loadStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await communityApi.getStaff();
      setStaffList(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setStaffList([]);
    } finally {
      setStaffLoading(false);
    }
  };

  useEffect(() => {
    loadLatestComplaints();
    loadStaff();
  }, [selectedSociety]);

  const handleStaffAdded = (newStaff) => {
    setStaffList((prev) => [newStaff, ...prev]);
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Remove ${staffName} from staff?`)) return;
    try {
      await communityApi.deleteStaff(staffId);
      setStaffList((prev) => prev.filter((s) => (s.id || s._id) !== staffId));
    } catch (err) {
      alert(err?.message || "Failed to remove staff member");
    }
  };

  const onDutyCount = staffList.filter((s) => s.status === "On Duty").length;

  const stats = [
    { label: "Active complaints", value: 42, change: -9, icon: ClipboardList, tone: "info" },
    { label: "Collection this month (₹)", value: 2185000, change: 11, icon: Banknote, tone: "success" },
    { label: "Occupied flats", value: 386, change: 2, icon: Building2, tone: "primary" },
    {
      label: "Staff on duty",
      value: staffLoading ? "—" : onDutyCount,
      change: -4,
      icon: Users,
      tone: "amber",
    },
  ];

  return (
    <>
      <PageHeader
        icon={Building2}
        title={`Good morning, ${user?.name || "Secretary"}`}
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

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Charts Row */}
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <SurfaceCard className="xl:col-span-2" title="Complaints raised vs resolved" description="Society wide reporting">
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

      {/* Staff on Duty Section */}
      <div className="mt-5">
        <SurfaceCard
          title="Staff on Duty"
          description={`${onDutyCount} member${onDutyCount !== 1 ? "s" : ""} currently on duty · ${staffList.length} total registered`}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadStaff} className="gap-1.5" title="Refresh">
                <RefreshCw className={`h-3.5 w-3.5 ${staffLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button size="sm" onClick={() => setIsAddStaffOpen(true)} className="gap-1.5 bg-teal-600 hover:bg-teal-500 text-white">
                <UserPlus className="h-4 w-4" />
                Add New Staff
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/staff">View All</Link>
              </Button>
            </div>
          }
        >
          {staffLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading staff…
            </div>
          ) : staffList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10">
                <HardHat className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No staff registered yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Add your first staff member — plumbers, electricians, security guards — to assign them to complaints.
              </p>
              <Button size="sm" onClick={() => setIsAddStaffOpen(true)} className="gap-1.5 mt-1 bg-teal-600 hover:bg-teal-500 text-white">
                <UserPlus className="h-4 w-4" /> Add First Staff Member
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-white/5 border-b border-white/8">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Shift / Wing</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {staffList.slice(0, 8).map((staff) => {
                    const sid = staff.id || staff._id;
                    return (
                      <tr key={sid} className="hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/15 border border-teal-500/25 text-teal-400 text-xs font-bold flex-shrink-0">
                              {(staff.name || "S").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground text-sm">{staff.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-xs font-medium text-foreground">
                            {staff.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{staff.shift || "General"}</div>
                          <div className="mt-0.5">Wing: {staff.assignedWing || "All"}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground space-y-0.5">
                          {staff.phone && (
                            <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{staff.phone}</div>
                          )}
                          {staff.email && (
                            <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{staff.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(staff.status)}`}>
                            {staff.status || "On Duty"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteStaff(sid, staff.name)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Remove staff"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {staffList.length > 8 && (
                <div className="px-4 py-3 border-t border-white/8 text-center">
                  <Link to="/staff" className="text-xs text-teal-400 hover:text-teal-300 font-medium">
                    View all {staffList.length} staff members →
                  </Link>
                </div>
              )}
            </div>
          )}
        </SurfaceCard>
      </div>

      {/* Complaints + Chart Row */}
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
            {latestComplaints.map((c) => {
              const cId = c.complaintNumber || c.id || c._id;
              const cFlat = c.flatNumber
                ? `${c.wing ? c.wing + "-" : ""}${c.flatNumber}`
                : c.flat || "Flat";
              const cDate = c.createdAt
                ? new Date(c.createdAt).toLocaleDateString()
                : c.updated || "Recent";

              return (
                <li
                  key={c.id || c._id}
                  onClick={() => { setSelectedComplaint(c); setIsDetailsOpen(true); }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 px-2 rounded-xl transition-all duration-200 hover:bg-accent/60 cursor-pointer group"
                  title="Click to view complete complaint details and photos"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      <span>{c.title}</span>
                      <span className="text-[11px] font-normal text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        View details →
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono text-primary font-medium">{cId}</span> · {c.category} · Flat {cFlat} · {cDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={c.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Collection vs dues" description="Monthly maintenance in ₹">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke={chartTheme.axis} tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `${v / 100000}L`} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "oklch(0.7 0 0 / 0.06)" }} />
                <Bar dataKey="collected" fill="var(--color-chart-1)" radius={[10, 10, 4, 4]} />
                <Bar dataKey="dues" fill="var(--color-chart-3)" radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        open={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onAdded={handleStaffAdded}
      />

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        complaintId={selectedComplaint?.id || selectedComplaint?._id}
        initialData={selectedComplaint}
        onUpdated={loadLatestComplaints}
        isSecretary={true}
      />
    </>
  );
}
