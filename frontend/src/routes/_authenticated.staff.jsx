import { createFileRoute } from "@tanstack/react-router";
import { HardHat, Search, UserPlus, Phone, Mail, Clock, ShieldCheck, Trash2, Edit3, RefreshCw, AlertCircle, Wrench } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { communityApi } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  component: StaffManagementPage,
});

const ROLE_OPTIONS = [
  "Plumber",
  "Electrician",
  "Housekeeping",
  "Security Guard",
  "Supervisor",
  "Gardener",
  "Other",
];

const SHIFT_OPTIONS = ["Morning", "Evening", "Night", "General"];
const STATUS_OPTIONS = ["On Duty", "Off Duty", "On Leave", "Terminated"];

function StaffManagementPage() {
  const { user } = useAuth();
  const { activeSociety } = useSociety();
  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    role: "Plumber",
    shift: "General",
    status: "On Duty",
    assignedWing: "All",
  });

  const currentSocietyId = activeSociety?.id || activeSociety?._id || user?.societyId;

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const params = currentSocietyId ? { societyId: currentSocietyId } : {};
      const res = await communityApi.getStaff(params);
      const data = res?.data || res || [];
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[StaffPage] Error fetching staff:", err.message);
      toast.error(err.message || "Failed to load staff list");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [activeSociety?.id, currentSocietyId]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Staff name is required");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      toast.error("Valid contact phone number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await communityApi.createStaff({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role,
        shift: formData.shift,
        status: formData.status,
        assignedWing: formData.assignedWing.trim() || "All",
        societyId: currentSocietyId,
      });
      toast.success(`${formData.name} added to society staff`);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        role: "Plumber",
        shift: "General",
        status: "On Duty",
        assignedWing: "All",
      });
      fetchStaff();
    } catch (err) {
      toast.error(err.message || "Failed to add staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (staffId, newStatus) => {
    try {
      await communityApi.updateStaff(staffId, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId || s._id === staffId ? { ...s, status: newStatus } : s))
      );
    } catch (err) {
      toast.error(err.message || "Failed to update staff status");
    }
  };

  const handleDeleteStaff = async (staffId, staffName) => {
    if (!window.confirm(`Are you sure you want to remove ${staffName} from society staff?`)) {
      return;
    }
    try {
      await communityApi.deleteStaff(staffId);
      toast.success(`${staffName} removed from staff list`);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId && s._id !== staffId));
    } catch (err) {
      toast.error(err.message || "Failed to delete staff member");
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.phone?.includes(searchTerm);
    const matchesRole = roleFilter === "All" || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={HardHat}
        title="Society Staff Directory"
        description={`Manage maintenance technicians, facility team, and guards for ${activeSociety?.name || "your society"}.`}
        actions={
          isSecretary ? (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="gap-1.5 shadow-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white"
            >
              <UserPlus className="size-4" /> Add Staff Member
            </Button>
          ) : null
        }
      />

      <SurfaceCard className="p-4 sm:p-6 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="All">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchStaff}
              disabled={isLoading}
              className="h-9 px-2.5"
              title="Refresh staff list"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Role & Skills</th>
                <th className="px-4 py-3">Shift & Wing</th>
                <th className="px-4 py-3">Status</th>
                {isSecretary && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={isSecretary ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    <RefreshCw className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading society staff directory...
                  </td>
                </tr>
              ) : filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  const staffId = staff.id || staff._id;
                  const isDuty = staff.status === "On Duty";
                  const isLeave = staff.status === "On Leave";
                  const isTerminated = staff.status === "Terminated";

                  return (
                    <tr key={staffId} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {staff.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs sm:text-sm">{staff.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="size-3 text-primary" /> {staff.phone}
                            </p>
                            {staff.email && (
                              <p className="text-[11px] text-muted-foreground/75 flex items-center gap-1">
                                <Mail className="size-3" /> {staff.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border">
                            {staff.role}
                          </span>
                          {staff.staffId && (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ID: {staff.staffId}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          <p className="text-foreground font-medium flex items-center gap-1">
                            <Clock className="size-3 text-muted-foreground" /> {staff.shift || "General"} Shift
                          </p>
                          <p className="text-[11px]">Wing: {staff.assignedWing || "All"}</p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {isSecretary ? (
                          <select
                            value={staff.status || "On Duty"}
                            onChange={(e) => handleStatusChange(staffId, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                              isDuty
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                : isLeave
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                : isTerminated
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-background text-foreground">
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge
                            variant={
                              isDuty
                                ? "default"
                                : isLeave
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {staff.status}
                          </Badge>
                        )}
                      </td>

                      {isSecretary && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(staffId, staff.name)}
                            className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Remove staff member"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isSecretary ? 5 : 4} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <HardHat className="size-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No staff members found</p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm || roleFilter !== "All"
                          ? "Try clearing your filters or search terms."
                          : "No staff members are registered for this society yet. Add staff members like plumbers, electricians, or guards to assign them to resident complaints."}
                      </p>
                      {isSecretary && (
                        <Button
                          onClick={() => setIsAddModalOpen(true)}
                          size="sm"
                          className="mt-2 text-xs"
                        >
                          <UserPlus className="size-3.5 mr-1.5" /> Add First Staff Member
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {/* Add Staff Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <UserPlus className="size-4 text-primary" /> Add Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs">
              Register a staff member or facility contractor to assign them to society complaints and service requests.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Full Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Pawar"
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Role / Specialization *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Phone Number *</label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9823001122"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Email Address (Optional)</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@society.com"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Assigned Wing / Area</label>
                <Input
                  value={formData.assignedWing}
                  onChange={(e) => setFormData({ ...formData, assignedWing: e.target.value })}
                  placeholder="e.g. All, Wing A, Gate 1"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Working Shift</label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 flex h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="On Duty">On Duty</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs font-semibold"
              >
                {isSubmitting ? "Adding..." : "Add Staff Member"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
