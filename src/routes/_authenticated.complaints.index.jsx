import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { complaints } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/complaints/")({
  head: () => ({
    meta: [
      { title: "Complaints — Havenly Estates" },
      {
        name: "description",
        content:
          "Track, sort and export every society complaint with status, priority and assigned staff.",
      },
      { property: "og:title", content: "Complaints — Havenly Estates" },
      {
        property: "og:description",
        content: "Track, sort and export every society complaint in one enterprise workspace.",
      },
    ],
  }),
  component: ComplaintsPage,
});

const columns = [
  { key: "id", header: "Ticket", sortable: true, className: "font-semibold" },
  { key: "title", header: "Issue", sortable: true, className: "max-w-[280px] truncate" },
  { key: "category", header: "Category", sortable: true },
  { key: "flat", header: "Flat", sortable: true },
  { key: "raisedBy", header: "Raised by" },
  {
    key: "priority",
    header: "Priority",
    sortable: true,
    render: (r) => <StatusBadge value={r.priority} />,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (r) => <StatusBadge value={r.status} />,
  },
  { key: "updated", header: "Updated", className: "text-muted-foreground" },
];

function ComplaintsPage() {
  const { user } = useAuth();
  const handleStatusChange = (id, newStatus) => {
    socketService.emit("complaint_status_changed", {
      id: id,
      status: newStatus,
      updatedBy: user?.name,
    });
    toast.success(`Complaint ${id} marked as ${newStatus}`);
  };

  const dynamicColumns = [...columns];
  if (user?.role === "secretary") {
    dynamicColumns.push({
      key: "id", // Using id just as a dummy key for actions
      header: "",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange(r.id, "In Progress")}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Set In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange(r.id, "Resolved")}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <>
      <PageHeader
        icon={MessagesSquare}
        title="Complaints"
        description="Every ticket raised across the society with live status and SLA tracking."
        actions={
          <Button size="sm" asChild>
            <Link to="/complaints/new">
              <Plus /> Register
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={dynamicColumns}
        rows={complaints}
        searchKeys={["id", "title", "category", "flat", "raisedBy", "status"]}
        pageSize={8}
        emptyLabel="No complaints match your search"
      />
    </>
  );
}
