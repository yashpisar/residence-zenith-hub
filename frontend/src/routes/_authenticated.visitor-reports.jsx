import { createFileRoute } from "@tanstack/react-router";
import { History, Calendar, Search, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { visitorApi } from "@/services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/visitor-reports")({
  head: () => ({
    meta: [
      { title: "Visitor Reports – Harmony" },
      { name: "description", content: "Gate analytics and entry/exit visitor logs from MongoDB." },
    ],
  }),
  component: VisitorReportsPage,
});

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VisitorReportsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await visitorApi.getAll({ search: searchTerm.trim() });
      const list = res?.data?.visitors || res?.visitors || res?.data || [];
      setLogs(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Failed to load visitor reports.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const exportExcel = () => {
    if (logs.length === 0) {
      toast.error("No visitor logs to export.");
      return;
    }
    const rows = logs.map((v) => ({
      ID: v.id || v._id,
      Visitor: v.name || v.visitorName,
      Phone: v.phone || "—",
      Type: v.purpose || "Guest",
      Flat: v.flat || `${v.wing || ""}-${v.flatNumber || ""}`,
      EntryTime: v.entryTime ? new Date(v.entryTime).toLocaleString() : "—",
      ExitTime: v.exitTime ? new Date(v.exitTime).toLocaleString() : "—",
      Status: v.status || v.approvalStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VisitorLogs");
    XLSX.writeFile(wb, "Visitor_Audit_Report.xlsx");
    toast.success("Excel report exported.");
  };

  const exportPDF = () => {
    if (logs.length === 0) {
      toast.error("No visitor logs to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Visitor Entry & Exit Report - Harmony Society", 14, 15);
    const tableData = logs.map((v) => [
      v.id ? v.id.slice(-6) : "—",
      v.name || v.visitorName,
      v.purpose || "Guest",
      v.flat || `${v.wing || ""}-${v.flatNumber || ""}`,
      v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      v.exitTime ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      v.status || v.approvalStatus,
    ]);

    doc.autoTable({
      head: [["ID", "Visitor", "Type", "Flat", "Time In", "Time Out", "Status"]],
      body: tableData,
      startY: 20,
    });

    doc.save("Visitor_Audit_Report.pdf");
    toast.success("PDF report exported.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Visitor Reports"
        description="Gate security analytics and entry/exit audit logs saved to MongoDB."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`mr-1.5 size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel}>
              <Download className="mr-1.5 size-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <Download className="mr-1.5 size-4" /> PDF
            </Button>
          </div>
        }
      />

      <SurfaceCard className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by visitor, flat, purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md font-medium">
            <Calendar className="h-3.5 w-3.5 mr-1.5 text-primary" />
            {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading visitor audit records…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="mr-2 size-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Visitor</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Flat</th>
                  <th className="px-4 py-3 font-semibold">Time In</th>
                  <th className="px-4 py-3 font-semibold">Time Out</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length > 0 ? (
                  logs.map((log) => {
                    const lId = log.id || log._id;
                    return (
                      <tr key={lId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-semibold text-foreground block">{log.name || log.visitorName}</span>
                          <span className="text-xs text-muted-foreground">{log.phone || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{log.purpose || "Guest"}</td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {log.flat || `${log.wing || ""}-${log.flatNumber || ""}`}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {log.entryTime ? formatDate(log.entryTime) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {log.exitTime ? formatDate(log.exitTime) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.status === "Exited" || log.approvalStatus === "Approved"
                                ? "secondary"
                                : log.status === "Inside"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {log.status || log.approvalStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No visitor audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
}
