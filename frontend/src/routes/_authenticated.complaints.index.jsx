import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Plus, MoreHorizontal, CheckCircle, RefreshCcw, UserPlus, Eye } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { complaintApi } from "@/services/api";
import { toast } from "sonner";
import { ComplaintDetailsModal } from "@/components/complaints/ComplaintDetailsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/complaints/")({
  head: () => ({
    meta: [
      { title: "Complaints — Harmony" },
      { name: "description", content: "Track, sort and export every society complaint with status, priority and assigned staff." },
    ],
  }),
  component: ComplaintsPage,
});

function ComplaintsPage() {
  const { user } = useAuth();
  const role = user?.role || "resident";
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [openInAssignMode, setOpenInAssignMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await complaintApi.getAll();
      const apiData = Array.isArray(res?.data) ? res.data : [];
      const mapped = apiData.map((c) => ({
        id: c.complaintNumber || c.id || c._id,
        rawId: c._id || c.id,
        raw: c,
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now",
        assignedStaff:
          c.assignedStaff?.name ||
          (typeof c.assignedStaff === "string" ? c.assignedStaff : "Unassigned"),
        flat: c.flatNumber ? `${c.wing ? c.wing + "-" : ""}${c.flatNumber}` : "Flat",
        raisedBy: c.createdBy?.name || "Resident",
      }));
      setComplaints(mapped);
    } catch (err) {
      console.warn("[Complaints] Fetch notice:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    const item = complaints.find((c) => c.id === id);
    const targetId = item?.rawId || id;
    try {
      await complaintApi.updateStatus(targetId, { status: newStatus });
      toast.success(`Complaint status set to ${newStatus}`);
      fetchComplaints();
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const displayedComplaints = complaints;

  const secretaryColumns = [
    { key: "id", header: "Ticket", sortable: true, className: "font-semibold" },
    { key: "title", header: "Issue", sortable: true, className: "max-w-[250px] truncate" },
    { key: "category", header: "Category", sortable: true },
    { key: "flat", header: "Flat", sortable: true },
    { key: "raisedBy", header: "Raised by" },
    { key: "priority", header: "Priority", sortable: true, render: (r) => <StatusBadge value={r.priority} /> },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge value={r.status} /> },
    { key: "assignedStaff", header: "Assigned" },
    { key: "actions", header: "", render: (r) => (
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { 
              setSelectedComplaint(r.raw || r); 
              setOpenInAssignMode(false);
              setIsDetailsOpen(true); 
            }}>
              <Eye className="mr-2 h-4 w-4 text-primary" /> View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(r.id, "In Progress")}><RefreshCcw className="mr-2 h-4 w-4" /> Set In Progress</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(r.id, "Resolved")}><CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { 
              setSelectedComplaint(r.raw || r); 
              setOpenInAssignMode(true);
              setIsDetailsOpen(true); 
            }}>
              <UserPlus className="mr-2 h-4 w-4 text-primary" /> Assign Staff
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )}
  ];

  const residentColumns = [
    { key: "id", header: "Complaint ID", sortable: true, className: "font-semibold text-primary" },
    { key: "title", header: "Title", sortable: true, className: "max-w-[300px] truncate" },
    { key: "category", header: "Category", sortable: true },
    { key: "priority", header: "Priority", sortable: true, render: (r) => <StatusBadge value={r.priority} /> },
    { key: "date", header: "Date", sortable: true },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge value={r.status} /> },
    { key: "assignedStaff", header: "Assigned Staff" },
  ];

  return (
    <>
      <PageHeader
        icon={MessagesSquare}
        title={role === "secretary" ? "All Complaints" : "My Complaints"}
        description={role === "secretary" ? "Manage and track society-wide complaints. Click any complaint to view full details and photo evidence." : "Track your raised complaints and issues. Click any complaint to view full details."}
        actions={
          <Button size="sm" asChild>
            <Link to="/complaints/new"><Plus className="mr-2 h-4 w-4" /> New Complaint</Link>
          </Button>
        }
      />
      <div className="p-6">
        <DataTable
          columns={role === "secretary" ? secretaryColumns : residentColumns}
          rows={displayedComplaints}
          searchKeys={["id", "title", "category", "status"]}
          pageSize={10}
          emptyLabel="No complaints found."
          onRowClick={(row) => {
            setSelectedComplaint(row.raw || row);
            setOpenInAssignMode(false);
            setIsDetailsOpen(true);
          }}
        />
      </div>

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedComplaint(null);
          setOpenInAssignMode(false);
        }}
        complaintId={selectedComplaint?._id || selectedComplaint?.rawId || selectedComplaint?.id}
        initialData={selectedComplaint}
        onUpdated={fetchComplaints}
        isSecretary={role === "secretary"}
        startInAssignMode={openInAssignMode}
      />
    </>
  );
}

