import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { History, Download, RefreshCw, AlertTriangle, Search, Filter, LogOut, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { VisitorDetailsModal } from "@/components/visitors/VisitorDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { visitorApi } from "@/services/api";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.startsWith("data:")) return fileUrl;
  if (fileUrl.startsWith("/api/v1/")) return `${API_BASE.replace("/api/v1", "")}${fileUrl}`;
  return `${API_BASE.replace("/api/v1", "")}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

export const Route = createFileRoute("/_authenticated/visitors/history")({
  component: VisitorHistory,
});

function VisitorHistory() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchVisitors = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (filter && filter !== "all") params.status = filter;
      if (search.trim()) params.search = search.trim();

      const res = await visitorApi.getAll(params);
      const visitorList = res?.data?.visitors || res?.visitors || res?.data || [];
      setData(Array.isArray(visitorList) ? visitorList : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load visitor history.");
    } finally {
      setIsLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Real-time socket event listeners
  useEffect(() => {
    const handleRefresh = () => {
      fetchVisitors();
    };

    socketService.on("visitor:entered", handleRefresh);
    socketService.on("visitor:exited", handleRefresh);
    socketService.on("visitor:approved", handleRefresh);
    socketService.on("visitor:rejected", handleRefresh);

    return () => {
      socketService.off("visitor:entered", handleRefresh);
      socketService.off("visitor:exited", handleRefresh);
      socketService.off("visitor:approved", handleRefresh);
      socketService.off("visitor:rejected", handleRefresh);
    };
  }, [fetchVisitors]);

  const handleQuickExit = async (e, visitor) => {
    e.stopPropagation();
    const id = visitor.id || visitor._id;
    setActionLoadingId(id);
    try {
      await visitorApi.recordExit(id);
      toast.success(`${visitor.name || visitor.visitorName} marked as exited.`);
      fetchVisitors();
    } catch (err) {
      toast.error(err.message || "Failed to record exit");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickEntry = async (e, visitor) => {
    e.stopPropagation();
    const id = visitor.id || visitor._id;
    setActionLoadingId(id);
    try {
      await visitorApi.recordEntry(id);
      toast.success(`${visitor.name || visitor.visitorName} entry recorded.`);
      fetchVisitors();
    } catch (err) {
      toast.error(err.message || "Failed to record entry");
    } finally {
      setActionLoadingId(null);
    }
  };

  const exportExcel = () => {
    if (data.length === 0) {
      toast.error("No visitor records to export.");
      return;
    }
    const exportRows = data.map((v) => ({
      ID: v.id || v._id,
      Name: v.name || v.visitorName,
      Phone: v.phone || "—",
      Purpose: v.purpose || "Guest",
      Flat: v.flat || `${v.wing || ""}-${v.flatNumber || ""}`,
      Vehicle: v.vehicleNumber || "None",
      EntryTime: v.entryTime ? new Date(v.entryTime).toLocaleString() : "—",
      ExitTime: v.exitTime ? new Date(v.exitTime).toLocaleString() : "—",
      Status: v.status || v.approvalStatus,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Visitors");
    XLSX.writeFile(wb, "Visitor_History_Report.xlsx");
    toast.success("Excel report downloaded");
  };

  const exportPDF = () => {
    if (data.length === 0) {
      toast.error("No visitor records to export.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Visitor History Report - Harmony Society", 14, 15);
    const tableData = data.map((v) => [
      v.id ? v.id.slice(-6) : "—",
      v.name || v.visitorName,
      v.phone || "—",
      v.purpose || "Guest",
      v.flat || `${v.wing || ""}-${v.flatNumber || ""}`,
      v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      v.exitTime ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—",
      v.status || v.approvalStatus,
    ]);

    doc.autoTable({
      head: [["ID", "Name", "Phone", "Purpose", "Flat", "Entry", "Exit", "Status"]],
      body: tableData,
      startY: 20,
    });

    doc.save("Visitor_History_Report.pdf");
    toast.success("PDF report downloaded");
  };

  return (
    <>
      <PageHeader
        icon={History}
        title="Visitor history"
        description="Gate log of every visitor entry and exit saved permanently to MongoDB."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchVisitors} disabled={isLoading}>
              <RefreshCw className={`mr-2 size-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
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
        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, flat, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md bg-card"
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading visitor records from database…</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-xl">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchVisitors}>
              <RefreshCw className="mr-2 size-4" /> Retry
            </Button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !fetchError && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Visitor</th>
                    <th className="px-6 py-4 font-semibold">Purpose</th>
                    <th className="px-6 py-4 font-semibold">Flat</th>
                    <th className="px-6 py-4 font-semibold">Entry - Exit</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.length > 0 ? (
                    data.map((v) => {
                      const vId = v.id || v._id;
                      const photoUrl = getFileUrl(v.photographUrl);
                      const isInside = v.entryTime && !v.exitTime;
                      const isApprovedNotEntered = v.approvalStatus === "Approved" && !v.entryTime;

                      return (
                        <tr
                          key={vId}
                          onClick={() => setSelectedVisitor(v)}
                          className="hover:bg-muted/30 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-full bg-muted flex-shrink-0 overflow-hidden border border-border">
                                {photoUrl ? (
                                  <img
                                    src={photoUrl}
                                    alt={v.name || v.visitorName}
                                    className="size-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || v.visitorName || "G")}&background=random`;
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(v.name || v.visitorName || "G")}&background=random`}
                                    alt={v.name || v.visitorName}
                                    className="size-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-foreground block group-hover:text-primary transition-colors">
                                  {v.name || v.visitorName}
                                </span>
                                <span className="text-xs text-muted-foreground">{v.phone || "No phone"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{v.purpose || "Guest"}</span>
                              {v.vehicleNumber && (
                                <span className="text-xs text-muted-foreground">{v.vehicleNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">
                            {v.flat || `${v.wing || ""}-${v.flatNumber || ""}`}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col text-xs">
                              <span className="font-medium text-foreground">
                                {v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                              </span>
                              <span className="text-muted-foreground">
                                {v.exitTime
                                  ? `to ${new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                  : isInside
                                  ? "Currently Inside"
                                  : "Not entered"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge value={v.status || v.approvalStatus} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {isInside && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
                                  disabled={actionLoadingId === vId}
                                  onClick={(e) => handleQuickExit(e, v)}
                                >
                                  <LogOut className="size-3.5 mr-1" />
                                  {actionLoadingId === vId ? "Exiting…" : "Mark Exit"}
                                </Button>
                              )}
                              {isApprovedNotEntered && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold text-primary hover:bg-primary/10"
                                  disabled={actionLoadingId === vId}
                                  onClick={(e) => handleQuickEntry(e, v)}
                                >
                                  <CheckCircle2 className="size-3.5 mr-1" />
                                  {actionLoadingId === vId ? "Checking in…" : "Check In"}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs"
                                onClick={() => setSelectedVisitor(v)}
                              >
                                Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No visitor records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <VisitorDetailsModal
        visitor={selectedVisitor}
        isOpen={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
        onStatusChange={fetchVisitors}
      />
    </>
  );
}
