import { createFileRoute } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { StatusBadge } from "@/components/app/StatusBadge";

export const Route = createFileRoute("/_authenticated/notices")({
  head: () => ({
    meta: [
      { title: "Notices — Harmony" },
      { name: "description", content: "Society announcements, circulars and emergency broadcasts." },
    ],
  }),
  component: NoticesPage,
});

const noticesData = [
  { id: "NOT-001", title: "Annual General Meeting 2023", category: "Meeting", date: "2023-11-01", postedBy: "Secretary", priority: "High", description: "The AGM will be held on Nov 15th at the Clubhouse." },
  { id: "NOT-002", title: "Water Supply Interruption", category: "Maintenance", date: "2023-10-28", postedBy: "Facility Manager", priority: "Critical", description: "Water supply will be stopped from 10 AM to 2 PM on Oct 30th." },
  { id: "NOT-003", title: "Diwali Celebration Details", category: "Event", date: "2023-10-20", postedBy: "Cultural Committee", priority: "Low", description: "Join us for the grand Diwali celebration at the main lawn." },
];

function NoticesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const columns = [
    { key: "title", header: "Notice Title", sortable: true, className: "font-semibold max-w-[200px] truncate" },
    { key: "category", header: "Category", sortable: true },
    { key: "description", header: "Description", className: "max-w-[300px] truncate text-muted-foreground" },
    { key: "date", header: "Date", sortable: true },
    { key: "postedBy", header: "Posted By" },
    { key: "priority", header: "Priority", sortable: true, render: (r) => <StatusBadge value={r.priority} /> },
  ];

  return (
    <>
      <PageHeader
        icon={Bell}
        title="Notices"
        description="Society announcements, circulars and emergency broadcasts."
      />
      <div className="p-6">
        <DataTable
          columns={columns}
          rows={noticesData}
          searchKeys={["title", "category", "description"]}
          pageSize={10}
          emptyLabel="No notices found."
        />
      </div>
    </>
  );
}
