import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, MessageSquarePlus, Send, Trash2, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/complaints/new")({
  head: () => ({
    meta: [
      { title: "Register a Complaint — Havenly Estates" },
      {
        name: "description",
        content:
          "Raise a society complaint with category, priority, description and photo evidence in seconds.",
      },
      { property: "og:title", content: "Register a Complaint — Havenly Estates" },
      {
        property: "og:description",
        content: "Raise a society complaint with photo evidence in seconds.",
      },
    ],
  }),
  component: NewComplaint,
});

const categories = ["Plumbing", "Electrical", "Housekeeping", "Security", "Amenities", "Parking", "Civil"];
const priorities = ["Low", "Medium", "High", "Critical"] as const;

function Field({
  label,
  children,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string | undefined;
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/25";

function NewComplaint() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState<(typeof priorities)[number]>("Medium");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    setPreview(URL.createObjectURL(file));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 6) {
      setError("Please describe the issue in at least 6 characters.");
      return;
    }
    setError(undefined);
    toast.success("Complaint registered", {
      description: "Ticket CMP-2042 created and routed to the facility team.",
    });
    navigate({ to: "/complaints" });
  };

  return (
    <>
      <PageHeader
        icon={MessageSquarePlus}
        title="Register a complaint"
        description="Tickets are routed to the right staff instantly and tracked against an SLA."
      />

      <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SurfaceCard title="Complaint details" description="All fields are validated before submission">
          <div className="grid gap-5">
            <Field label="Title" error={error} hint="Short summary of the problem">
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Water seepage in bedroom ceiling"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Category">
                <select
                  className={inputClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Flat / location">
                <input className={inputClass} defaultValue="A-302" />
              </Field>
            </div>

            <Field label="Priority">
              <div className="flex flex-wrap gap-2">
                {priorities.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                      priority === p
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Description" hint={`${description.length}/600 characters`}>
              <textarea
                className={cn(inputClass, "h-32 resize-none py-3")}
                maxLength={600}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe when it started, what you observed and any access instructions…"
              />
            </Field>
          </div>
        </SurfaceCard>

        <div className="grid gap-5 content-start">
          <SurfaceCard title="Photo evidence" description="Drag and drop or browse">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "grid place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
                dragging ? "border-primary bg-primary/10" : "border-border bg-background/40",
              )}
            >
              {preview ? (
                <div className="w-full">
                  <img
                    src={preview}
                    alt="Complaint evidence preview"
                    className="mx-auto max-h-44 w-full rounded-xl object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setPreview(null)}
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              ) : (
                <>
                  <UploadCloud className="size-8 text-primary" />
                  <p className="mt-2 text-sm font-semibold text-foreground">Drop an image here</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG up to 5MB</p>
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-accent">
                    <ImagePlus className="size-4" /> Browse
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </label>
                </>
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Summary">
            <dl className="space-y-3 text-sm">
              {[
                ["Category", category],
                ["Priority", priority],
                ["Expected SLA", priority === "Critical" ? "4 hours" : "48 hours"],
                ["Visibility", "Society management"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <Button type="submit" className="mt-5 w-full">
              <Send /> Submit complaint
            </Button>
          </SurfaceCard>
        </div>
      </form>
    </>
  );
}
