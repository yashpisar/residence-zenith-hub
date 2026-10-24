import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Search,
  Phone,
  Mail,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  KeyRound,
  Copy,
  Plus,
  Loader2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { communityApi } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/residents")({
  component: ResidentsPage,
});

function ResidentsPage() {
  const { user } = useAuth();
  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  const [activeTab, setActiveTab] = useState("residents"); // "residents" | "pending" | "invitations"
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [residents, setResidents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [invitations, setInvitations] = useState([]);

  // Invite creation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdTokenResult, setCreatedTokenResult] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    role: "resident",
    residentType: "Tenant",
    wing: "A",
    flatNumber: "",
    recipientEmail: "",
    recipientPhone: "",
    expiresDays: 7,
  });
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  // Load residents, pending requests, and invitations
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resResidents, resPending, resInvitations] = await Promise.all([
        communityApi.getResidents().catch(() => ({ data: [] })),
        isSecretary ? communityApi.getMembershipRequests().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        isSecretary ? communityApi.getInvitations().catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const rList = Array.isArray(resResidents) ? resResidents : resResidents?.data || [];
      const pList = Array.isArray(resPending) ? resPending : resPending?.data || [];
      const iList = Array.isArray(resInvitations) ? resInvitations : resInvitations?.data || [];

      setResidents(rList);
      setPendingRequests(pList);
      setInvitations(iList);
    } catch (err) {
      toast.error("Failed to load resident records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSecretary]);

  const handleApprove = async (id, name) => {
    try {
      await communityApi.approveMembershipRequest(id);
      toast.success(`Approved ${name}'s membership successfully.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to approve membership request.");
    }
  };

  const handleReject = async (id, name) => {
    const reason = window.prompt(`Enter rejection reason for ${name}:`, "Verification documents were missing or invalid.");
    if (reason === null) return;

    try {
      await communityApi.rejectMembershipRequest(id, reason);
      toast.info(`Application for ${name} rejected.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to reject membership request.");
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setIsCreatingInvite(true);

    try {
      const res = await communityApi.createInvitation(inviteForm);
      const data = res?.data || res;
      setCreatedTokenResult(data);
      toast.success("Single-use invitation token created!");
      fetchData();
    } catch (err) {
      toast.error(err.message || "Failed to create invitation token.");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleRevokeInvite = async (id) => {
    if (!window.confirm("Are you sure you want to revoke this invitation token?")) return;
    try {
      await communityApi.revokeInvitation(id);
      toast.success("Invitation token revoked.");
      fetchData();
    } catch (err) {
      toast.error("Failed to revoke invitation.");
    }
  };

  const filteredResidents = residents.filter(
    (res) =>
      res.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.wing && res.wing.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (res.flatNumber && res.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          icon={Users}
          title="Residents & Memberships"
          description="Manage approved residents, verify pending membership requests, and generate invite tokens."
        />

        {isSecretary && (
          <Button onClick={() => { setShowInviteModal(true); setCreatedTokenResult(null); }} className="gap-2">
            <KeyRound className="size-4" />
            Create Invitation Token
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("residents")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
            activeTab === "residents"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="size-4" />
          Approved Residents ({residents.length})
        </button>

        {isSecretary && (
          <>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "pending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Clock className="size-4" />
              Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500/20 text-amber-500 px-1.5 py-0.2 text-[10px] font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("invitations")}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                activeTab === "invitations"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <KeyRound className="size-4" />
              Invitations ({invitations.length})
            </button>
          </>
        )}
      </div>

      {/* --- TAB 1: APPROVED RESIDENTS --- */}
      {activeTab === "residents" && (
        <SurfaceCard className="p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, wing or flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>
            <span className="text-xs text-muted-foreground">Showing {filteredResidents.length} verified residents</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Resident</th>
                  <th className="px-4 py-3 font-semibold">Flat / Unit</th>
                  <th className="px-4 py-3 font-semibold">Residency Type</th>
                  <th className="px-4 py-3 font-semibold">Contact Info</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResidents.map((resident) => (
                  <tr key={resident.id || resident._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{resident.name}</div>
                      <div className="text-[11px] text-muted-foreground">{resident.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {resident.wing ? `Wing ${resident.wing} - ` : ""}
                      {resident.flatNumber || resident.flat || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={resident.residentType === "Owner" ? "default" : "secondary"}>
                        {resident.residentType || resident.type || "Resident"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3" />
                        <span>{resident.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                        <CheckCircle2 className="size-3.5" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredResidents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No approved residents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* --- TAB 2: PENDING APPROVALS --- */}
      {activeTab === "pending" && isSecretary && (
        <SurfaceCard className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Membership Requests Awaiting Verification</h3>
              <p className="text-xs text-muted-foreground">
                Verify resident identity or title deeds before approving access to society facilities.
              </p>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-500">
              {pendingRequests.length} Pending
            </Badge>
          </div>

          <div className="grid gap-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-border bg-card/60 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-border/80 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{req.name}</span>
                    <Badge variant="outline">{req.role}</Badge>
                    <Badge variant="secondary">{req.residentType}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span>Applied Flat: <strong className="text-foreground font-mono">{req.wing ? `Wing ${req.wing} - ` : ""}{req.flatNumber}</strong></span>
                    <span>Email: <strong className="text-foreground">{req.email}</strong></span>
                    <span>Phone: <strong className="text-foreground">{req.phone || "N/A"}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-rose-500/30 text-rose-500 hover:bg-rose-500/10"
                    onClick={() => handleReject(req.id, req.name)}
                  >
                    <XCircle className="size-3.5" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleApprove(req.id, req.name)}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <CheckCircle2 className="size-8 mx-auto text-emerald-500" />
                <p className="text-sm font-medium text-foreground">No pending membership requests!</p>
                <p className="text-xs">All resident applications have been verified and processed.</p>
              </div>
            )}
          </div>
        </SurfaceCard>
      )}

      {/* --- TAB 3: INVITATIONS --- */}
      {activeTab === "invitations" && isSecretary && (
        <SurfaceCard className="p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-foreground">Active & Expired Invitation Codes</h3>
              <p className="text-xs text-muted-foreground">
                Cryptographically secure, single-use invite tokens issued by society management.
              </p>
            </div>
            <Button size="sm" onClick={() => { setShowInviteModal(true); setCreatedTokenResult(null); }} className="gap-1.5">
              <Plus className="size-3.5" /> New Invitation
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Target Role</th>
                  <th className="px-4 py-3 font-semibold">Flat / Unit</th>
                  <th className="px-4 py-3 font-semibold">Recipient Restriction</th>
                  <th className="px-4 py-3 font-semibold">Status / Usage</th>
                  <th className="px-4 py-3 font-semibold">Expires</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground capitalize">{inv.role}</div>
                      <div className="text-[11px] text-muted-foreground">{inv.residentType}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {inv.wing ? `Wing ${inv.wing} - ` : ""}
                      {inv.flatNumber || "Society-wide"}
                    </td>
                    <td className="px-4 py-3">
                      {inv.recipientEmail ? (
                        <span className="font-mono text-xs text-primary">{inv.recipientEmail}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Anyone with code</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {inv.isRevoked ? (
                        <span className="text-xs text-rose-500 font-semibold">Revoked</span>
                      ) : inv.usedCount >= inv.usageLimit ? (
                        <span className="text-xs text-muted-foreground line-through">Redeemed ({inv.usedCount}/{inv.usageLimit})</span>
                      ) : inv.isExpired ? (
                        <span className="text-xs text-amber-500 font-semibold">Expired</span>
                      ) : (
                        <span className="text-xs text-emerald-500 font-semibold">Active (0/{inv.usageLimit})</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!inv.isRevoked && inv.usedCount < inv.usageLimit && !inv.isExpired && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs h-7"
                          onClick={() => handleRevokeInvite(inv.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {invitations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No invitations issued yet. Click "Create Invitation Token" to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      {/* CREATE INVITATION MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Generate Single-Use Invitation</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            {createdTokenResult ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
                  <CheckCircle2 className="size-8 mx-auto text-emerald-500" />
                  <h4 className="font-bold text-foreground">Invitation Token Generated!</h4>
                  <p className="text-xs text-muted-foreground">
                    This raw token will never be displayed again. Copy and securely share it with the recipient.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-3 flex items-center justify-between font-mono text-sm break-all">
                  <span>{createdTokenResult.invitationToken}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 ml-2 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(createdTokenResult.invitationToken);
                      toast.success("Invitation code copied to clipboard!");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div><strong>Role:</strong> {createdTokenResult.role} ({createdTokenResult.residentType || "Standard"})</div>
                  {createdTokenResult.wing && (
                    <div><strong>Target Flat:</strong> Wing {createdTokenResult.wing} - {createdTokenResult.flatNumber}</div>
                  )}
                  <div><strong>Valid Until:</strong> {new Date(createdTokenResult.expiresAt).toLocaleString()}</div>
                </div>

                <Button className="w-full" onClick={() => setShowInviteModal(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground">Role</label>
                    <select
                      value={inviteForm.role}
                      onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                    >
                      <option value="resident">Flat Resident</option>
                      <option value="security">Security Guard</option>
                      <option value="secretary">Secretary Handover</option>
                    </select>
                  </div>

                  {inviteForm.role === "resident" && (
                    <div>
                      <label className="text-xs font-medium text-foreground">Resident Type</label>
                      <select
                        value={inviteForm.residentType}
                        onChange={(e) => setInviteForm({ ...inviteForm, residentType: e.target.value })}
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                      >
                        <option value="Tenant">Tenant</option>
                        <option value="Owner">Co-Owner / Owner</option>
                        <option value="FamilyMember">Family Member</option>
                      </select>
                    </div>
                  )}
                </div>

                {inviteForm.role === "resident" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Wing</label>
                      <input
                        type="text"
                        value={inviteForm.wing}
                        onChange={(e) => setInviteForm({ ...inviteForm, wing: e.target.value })}
                        placeholder="e.g. A"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Flat Number</label>
                      <input
                        type="text"
                        value={inviteForm.flatNumber}
                        onChange={(e) => setInviteForm({ ...inviteForm, flatNumber: e.target.value })}
                        placeholder="e.g. 101"
                        className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-foreground flex justify-between">
                    <span>Recipient Email Binding (Optional)</span>
                    <span className="text-[10px] text-muted-foreground">Only this email can redeem</span>
                  </label>
                  <input
                    type="email"
                    value={inviteForm.recipientEmail}
                    onChange={(e) => setInviteForm({ ...inviteForm, recipientEmail: e.target.value })}
                    placeholder="user@example.com (optional)"
                    className="mt-1 flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">Token Expiry</label>
                  <select
                    value={inviteForm.expiresDays}
                    onChange={(e) => setInviteForm({ ...inviteForm, expiresDays: Number(e.target.value) })}
                    className="mt-1 flex h-9 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-xs"
                  >
                    <option value={1}>1 Day</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (Recommended)</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isCreatingInvite}>
                    {isCreatingInvite ? <Loader2 className="mr-2 size-4 animate-spin" /> : "Generate Token"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
