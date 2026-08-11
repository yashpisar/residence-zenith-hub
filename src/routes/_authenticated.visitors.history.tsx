import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { History, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { visitors as mockVisitors, type Visitor } from "@/lib/mock-data";
import { VisitorDetailsModal } from "@/components/visitors/VisitorDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/visitors/history")({
  component: VisitorHistory,
});

function VisitorHistory() {
  const [data, setData] = useState<Visitor[]>(mockVisitors);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  useEffect(() => {
    const handleStatusChange = (updatedVisitor: any) => {
      setData((prev) => prev.map((v) => 
        v.id === updatedVisitor.id || v.name === updatedVisitor.name ? { ...v, status: updatedVisitor.status, exit: updatedVisitor.exit || v.exit } : v
      ));
    };

    socketService.on("visitor_status_changed", handleStatusChange);
    return () => socketService.off("visitor_status_changed", handleStatusChange);
  }, []);

  const filteredData = data.filter((v) => {
    const matchesSearch = 
      v.name.toLowerCase().includes(search.toLowerCase()) || 
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.flat.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "inside") return v.status === "Inside";
    if (filter === "exited") return v.status === "Exited";
    if (filter === "pending") return v.status === "Awaiting approval";
    return true;
  });

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitors");
    XLSX.writeFile(wb, "Visitor_Report.xlsx");
    toast.success("Excel report downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Visitor History Report", 14, 15);
    
    const tableData = filteredData.map(v => [
      v.id, v.name, v.purpose, v.flat, v.entry, v.exit || "—", v.status
    ]);

    (doc as any).autoTable({
      head: [["ID", "Name", "Purpose", "Flat", "Entry", "Exit", "Status"]],
      body: tableData,
      startY: 20,
    });

    doc.save("Visitor_Report.pdf");
    toast.success("PDF report downloaded");
  };

  return (
    <>
      <PageHeader
        icon={History}
        title="Visitor history"
        description="Every entry and exit logged at the gate, searchable and exportable."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <Download className="mr-2 size-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="mr-2 size-4" /> PDF
            </Button>
          </div>
        }
      />
      
      <div className="mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Input 
              placeholder="Search by name, ID, flat..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md bg-card"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="inside">Inside Society</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Visitor</th>
                  <th className="px-6 py-4 font-semibold">ID & Purpose</th>
                  <th className="px-6 py-4 font-semibold">Flat</th>
                  <th className="px-6 py-4 font-semibold">Entry - Exit</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length > 0 ? (
                  filteredData.map((v) => (
                    <tr 
                      key={v.id} 
                      onClick={() => setSelectedVisitor(v)}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${v.name}&background=random`} alt={v.name} className="size-full object-cover" />
                          </div>
                          <span className="font-semibold">{v.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{v.purpose}</span>
                          <span className="text-xs text-muted-foreground">{v.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{v.flat}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span>{v.entry}</span>
                          <span className="text-xs text-muted-foreground">{v.exit ? `to ${v.exit}` : "Ongoing"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge value={v.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No visitors found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <VisitorDetailsModal 
        visitor={selectedVisitor} 
        isOpen={!!selectedVisitor} 
        onClose={() => setSelectedVisitor(null)} 
        onStatusChange={() => {
          // Re-fetch or rely on socket to update list
        }}
      />
    </>
  );
}
