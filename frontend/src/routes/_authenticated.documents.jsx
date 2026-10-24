import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileText,
  Download,
  Eye,
  Upload,
  Plus,
  Trash2,
  X,
  RefreshCw,
  AlertTriangle,
  Search,
  Tag,
  Lock,
  Globe,
  FileType,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SurfaceCard } from "@/components/app/SurfaceCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSociety } from "@/contexts/SocietyContext";
import { communityApi, fileApi } from "@/services/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Documents – Harmony" },
      { name: "description", content: "Society documents, bye-laws, minutes, and financial reports." },
    ],
  }),
  component: DocumentsPage,
});

const CATEGORIES = ["Society Rules", "Meeting Minutes", "Notices", "Financial Documents", "Other"];

const CATEGORY_COLOURS = {
  "Society Rules": "bg-blue-100 text-blue-700",
  "Meeting Minutes": "bg-purple-100 text-purple-700",
  "Notices": "bg-amber-100 text-amber-700",
  "Financial Documents": "bg-green-100 text-green-700",
  "Other": "bg-gray-100 text-gray-600",
};

const FILE_ICONS = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/webp": "🖼️",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getFileUrl(fileUrl) {
  if (!fileUrl) return null;
  if (fileUrl.startsWith("http")) return fileUrl;
  if (fileUrl.startsWith("/api/v1/")) return `${API_BASE.replace("/api/v1", "")}${fileUrl}`;
  return `${API_BASE.replace("/api/v1", "")}${fileUrl}`;
}

// ── Main Page ────────────────────────────────────────────────────────────────
function DocumentsPage() {
  const { user } = useAuth();
  const { activeSociety } = useSociety();
  const isSecretary = user?.role === "secretary" || user?.role === "superadmin";

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = {};
      if (categoryFilter !== "All") params.category = categoryFilter;
      const res = await communityApi.getDocuments(params);
      const data = res?.data ?? res ?? [];
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await communityApi.deleteDocument(id);
      toast.success("Document deleted.");
      setDocuments((prev) => prev.filter((d) => d.id !== id && d._id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side search filter
  const filtered = search.trim()
    ? documents.filter(
        (d) =>
          d.title?.toLowerCase().includes(search.toLowerCase()) ||
          d.category?.toLowerCase().includes(search.toLowerCase()) ||
          d.uploaderName?.toLowerCase().includes(search.toLowerCase()) ||
          d.description?.toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Documents Vault"
        description={`Society documents, bye-laws, minutes, and reports — ${activeSociety?.name || "Harmony Society"}`}
        actions={
          isSecretary && (
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          )
        }
      />

      <div className="p-6 space-y-4">
        {/* Toolbar: category filter + search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-wrap gap-2">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <RefreshCw className="size-5 animate-spin" />
            <span>Loading documents…</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchDocuments}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !fetchError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <FileText className="size-10 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">No documents found</p>
            <p className="text-sm text-muted-foreground">
              {isSecretary
                ? 'Click "Upload Document" to add the first document.'
                : "No documents have been uploaded for this society yet."}
            </p>
          </div>
        )}

        {/* Documents grid */}
        {!isLoading && !fetchError && filtered.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((doc) => {
              const dId = doc.id || doc._id;
              const fileUrl = getFileUrl(doc.fileUrl);
              const fileIcon = FILE_ICONS[doc.fileType] || "📄";
              return (
                <SurfaceCard key={dId} className="group">
                  <div className="flex items-start gap-3">
                    {/* File icon */}
                    <div className="text-3xl shrink-0">{fileIcon}</div>

                    <div className="min-w-0 flex-1">
                      {/* Category badge */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                            CATEGORY_COLOURS[doc.category] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {doc.category || "Other"}
                        </span>
                        {doc.accessLevel === "secretary_only" && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                            <Lock className="size-2.5" /> Secretary only
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-foreground line-clamp-2">{doc.title}</h3>

                      {/* Description */}
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{doc.description}</p>
                      )}

                      {/* Meta */}
                      <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                        <p>{formatDate(doc.createdAt)} · {formatSize(doc.fileSize)}</p>
                        {doc.uploaderName && <p>Uploaded by {doc.uploaderName}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                    {fileUrl && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="size-3.5 mr-1.5" /> View
                        </Button>
                        <a href={fileUrl} download={doc.title} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-8 px-3">
                            <Download className="size-3.5" />
                          </Button>
                        </a>
                      </>
                    )}
                    {isSecretary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 ml-auto"
                        disabled={deletingId === dId}
                        onClick={() => handleDelete(dId)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Upload modal */}
      {showUpload && (
        <UploadDocumentModal
          onClose={() => setShowUpload(false)}
          onUploaded={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </>
  );
}

// ── Preview Modal ────────────────────────────────────────────────────────────
function DocumentPreviewModal({ doc, onClose }) {
  const fileUrl = getFileUrl(doc.fileUrl);
  const isPDF = doc.fileType === "application/pdf" || doc.fileUrl?.endsWith(".pdf");
  const isImage = doc.fileType?.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground truncate">{doc.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doc.category} · {formatSize(doc.fileSize)} · {formatDate(doc.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {fileUrl && (
              <a href={fileUrl} download={doc.title} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="size-4 mr-1.5" /> Download
                </Button>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {isPDF && fileUrl && (
            <iframe
              src={fileUrl}
              title={doc.title}
              className="w-full h-full min-h-[500px]"
              style={{ border: "none" }}
            />
          )}
          {isImage && fileUrl && (
            <div className="flex items-center justify-center p-4 h-full overflow-auto">
              <img
                src={fileUrl}
                alt={doc.title}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
          )}
          {!isPDF && !isImage && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <FileText className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
              {fileUrl && (
                <a href={fileUrl} download={doc.title} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="size-4 mr-1.5" /> Download to view
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ─────────────────────────────────────────────────────────────
function UploadDocumentModal({ onClose, onUploaded }) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Other",
    accessLevel: "public_to_society",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(null); // null | "uploading" | "saving" | "done"
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: "Only PDF, Word documents, and images are allowed." }));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: "File size must be under 15 MB." }));
      return;
    }
    setSelectedFile(file);
    setErrors((prev) => ({ ...prev, file: undefined }));
    // Auto-fill title from filename if empty
    if (!form.title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setForm((prev) => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Document title is required.";
    if (!selectedFile) errs.file = "Please select a file to upload.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: upload file
      setUploadProgress("uploading");
      const uploadRes = await fileApi.upload(selectedFile);
      const { fileUrl, fileSize, mimeType } = uploadRes?.data ?? uploadRes;

      // Step 2: save document record
      setUploadProgress("saving");
      const docRes = await communityApi.createDocument({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        fileUrl,
        fileType: mimeType || selectedFile.type,
        fileSize: fileSize || selectedFile.size,
        accessLevel: form.accessLevel,
      });

      setUploadProgress("done");
      const saved = docRes?.data ?? docRes;
      toast.success("Document uploaded successfully!");
      onUploaded(saved);
    } catch (err) {
      toast.error(err.message || "Failed to upload document. Please try again.");
      setUploadProgress(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressLabel = {
    uploading: "Uploading file…",
    saving: "Saving document record…",
    done: "Done!",
  }[uploadProgress] || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File drop zone */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              File <span className="text-destructive">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : errors.file
                  ? "border-destructive"
                  : selectedFile
                  ? "border-green-500 bg-green-500/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl">
                    {FILE_ICONS[selectedFile.type] || "📄"}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                  <button
                    type="button"
                    className="mt-1 text-xs text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-8 text-muted-foreground/60" />
                  <p className="text-sm font-semibold text-foreground">
                    Drop file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, or image · Max 15 MB
                  </p>
                </div>
              )}
            </div>
            {errors.file && <p className="mt-1 text-xs text-destructive">{errors.file}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Document Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder="e.g. Society Bye-laws 2024"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                errors.title ? "border-destructive" : "border-border"
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="Brief description of this document…"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Category + Access Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Visibility</label>
              <select
                value={form.accessLevel}
                onChange={(e) => handleChange("accessLevel", e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="public_to_society">All Members</option>
                <option value="secretary_only">Secretary Only</option>
              </select>
            </div>
          </div>

          {/* Progress bar */}
          {progressLabel && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2.5">
              <RefreshCw className="size-4 animate-spin text-primary shrink-0" />
              <span className="text-sm text-foreground">{progressLabel}</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  {progressLabel || "Uploading…"}
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
