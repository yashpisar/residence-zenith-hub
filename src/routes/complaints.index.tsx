import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { complaints, type Complaint } from "@/lib/mock-data";

export const Route = createFileRoute("/complaints/")({
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

const columns: Column<Complaint>[] = [
  { key: "id", header: "Ticket", sortable: true, className: "font-semibold" },
  { key: "title", header: "Issue", sortable: true, className: "max-w-[280px] truncate" },
  { key: "category", header: "Category", sortable: true },
  { key: "flat", header: "Flat", sortable: true },
  { key: "raisedBy", header: "Raised by" },
  { key: "priority", header: "Priority", sortable: true, render: (r) => <StatusBadge value={r.priority} /> },
  { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge value={r.status} /> },
  { key: "updated", header: "Updated", className: "text-muted-foreground" },
];

function ComplaintsPage() {
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
        columns={columns}
        rows={complaints}
        searchKeys={["id", "title", "category", "flat", "raisedBy", "status"]}
        pageSize={8}
        emptyLabel="No complaints match your search"
      />
    </>
  );
}
