import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/StatusBadge";
import { visitors, type Visitor } from "@/lib/mock-data";

export const Route = createFileRoute("/visitors/history")({
  head: () => ({
    meta: [
      { title: "Visitor History — Havenly Estates" },
      {
        name: "description",
        content: "Complete audit trail of gate entries, exits and delivery visits with export.",
      },
      { property: "og:title", content: "Visitor History — Havenly Estates" },
      { property: "og:description", content: "Complete audit trail of every gate entry and exit." },
    ],
  }),
  component: VisitorHistory,
});

const columns: Column<Visitor>[] = [
  { key: "id", header: "Pass", sortable: true, className: "font-semibold" },
  { key: "name", header: "Visitor", sortable: true },
  { key: "purpose", header: "Purpose", sortable: true },
  { key: "flat", header: "Flat", sortable: true },
  { key: "entry", header: "Entry" },
  { key: "exit", header: "Exit", render: (r) => r.exit ?? "—" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} /> },
];

function VisitorHistory() {
  return (
    <>
      <PageHeader
        icon={History}
        title="Visitor history"
        description="Every entry and exit logged at the gate, searchable and exportable."
      />
      <DataTable
        columns={columns}
        rows={visitors}
        searchKeys={["id", "name", "purpose", "flat", "status"]}
        emptyLabel="No visitor records found"
      />
    </>
  );
}
