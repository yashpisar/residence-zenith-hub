import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Inbox, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  searchKeys,
  pageSize = 6,
  emptyLabel = "Nothing here yet",
}: {
  columns: Column<T>[];
  rows: T[];
  searchKeys: (keyof T & string)[];
  pageSize?: number;
  emptyLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = q
      ? rows.filter((r) => searchKeys.some((k) => String(r[k]).toLowerCase().includes(q)))
      : [...rows];
    if (sort) {
      data.sort((a, b) => {
        const av = String(a[sort.key as keyof T]);
        const bv = String(b[sort.key as keyof T]);
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return data;
  }, [rows, query, sort, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const view = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const exportCsv = () => {
    const head = columns.map((c) => c.header).join(",");
    const body = filtered
      .map((r) => columns.map((c) => `"${String(r[c.key] ?? "")}"`).join(","))
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready", { description: `${filtered.length} rows downloaded as CSV.` });
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 sm:flex sm:items-center sm:justify-between">
        <label className="relative flex min-w-0 items-center sm:w-80">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search records…"
            className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {filtered.length} records
          </span>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download /> Export
          </Button>
        </div>
      </div>

      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "border-b border-border px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                    c.className,
                  )}
                >
                  {c.sortable ? (
                    <button
                      onClick={() =>
                        setSort((s) =>
                          s?.key === c.key
                            ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                            : { key: c.key, dir: "asc" },
                        )
                      }
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                    >
                      {c.header}
                      <ArrowUpDown className="size-3" />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((row, i) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-accent/60",
                  i % 2 === 1 && "bg-background/25",
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3.5 text-foreground", c.className)}>
                    {c.render ? c.render(row) : String(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {view.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl border border-border bg-background/50">
              <Inbox className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">{emptyLabel}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try adjusting your search or filters to find what you are looking for.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Page {current + 1} of {pages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
