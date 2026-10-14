"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Paperclip, Trash2, X } from "lucide-react";
import { Btn, Card, api } from "./ui";

// Keep in sync with src/lib/documents.ts (server enforces the same limits).
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MAX_FILES = 10;
const MAX_IMAGE_SIDE = 1800;

export const ID_FILE_ACCEPT = "image/*,application/pdf";

function fmtSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isAllowed(f: File) {
  return f.type.startsWith("image/") || f.type === "application/pdf";
}

/**
 * Phone cameras produce 3–10 MB photos. Scale images down (EXIF rotation is
 * applied by createImageBitmap) and re-encode as JPEG so uploads are quick on
 * mobile data and the DB stays small. PDFs, and anything the browser can't
 * decode, are sent unchanged.
 */
async function prepareFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // flatten transparency (PNG) before JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadDocument(bookingId: string | number, file: File) {
  const prepared = await prepareFile(file);
  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${file.name} is too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024} MB)`);
  }
  const fd = new FormData();
  fd.append("file", prepared, prepared.name);
  // Not api(): that helper forces a JSON Content-Type, which breaks multipart.
  const res = await fetch(`/api/admin/bookings/${bookingId}/documents`, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Upload failed (${res.status})`);
  return data;
}

/** Collects files in the New-booking form; they upload once the booking exists. */
export function IdProofPicker({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function add(list: FileList | null) {
    setError("");
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) { setError(`You can attach up to ${MAX_FILES} files.`); break; }
      if (!isAllowed(f)) { setError(`${f.name}: only photos and PDFs are allowed.`); continue; }
      if (f.type === "application/pdf" && f.size > MAX_UPLOAD_BYTES) {
        setError(`${f.name} is too large (PDFs can be up to ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`);
        continue;
      }
      next.push(f);
    }
    onChange(next);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">Guest ID proofs</span>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        {files.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{f.name}</span>
                  <span className="flex-shrink-0 text-xs text-slate-400">{fmtSize(f.size)}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onChange(files.filter((_, j) => j !== i))}
                  className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={ID_FILE_ACCEPT}
          className="hidden"
          onChange={(e) => add(e.target.files)}
        />
        <Btn variant="outline" size="sm" onClick={() => input.current?.click()}>
          <Paperclip className="h-4 w-4" /> Attach ID proof
        </Btn>
        <p className="mt-2 text-xs text-slate-400">Photo or PDF — Aadhaar, passport, licence, etc. On a phone you can use the camera.</p>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}

type Doc = { id: number; fileName: string; mimeType: string; sizeBytes: number };

/** ID proofs on an existing booking: view, add more, delete. */
export function BookingDocuments({ bookingId }: { bookingId: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/admin/bookings/${bookingId}/documents`);
      setDocs(d.documents || []);
    } catch { /* leave the list empty */ } finally { setLoading(false); }
  }, [bookingId]);
  useEffect(() => { load(); }, [load]);

  async function onPick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError("");
    setBusy(true);
    const problems: string[] = [];
    for (const f of Array.from(list)) {
      if (!isAllowed(f)) { problems.push(`${f.name}: only photos and PDFs are allowed`); continue; }
      try { await uploadDocument(bookingId, f); }
      catch (e) { problems.push(e instanceof Error ? e.message : `${f.name}: upload failed`); }
    }
    if (input.current) input.current.value = "";
    setBusy(false);
    if (problems.length) setError(problems.join(" · "));
    load();
  }

  async function remove(d: Doc) {
    if (!confirm(`Delete "${d.fileName}"?`)) return;
    try {
      await api(`/api/admin/bookings/${bookingId}/documents/${d.id}`, { method: "DELETE" });
      load();
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">Guest ID proofs</h3>
        <div>
          <input
            ref={input}
            type="file"
            multiple
            accept={ID_FILE_ACCEPT}
            className="hidden"
            onChange={(e) => onPick(e.target.files)}
          />
          <Btn size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            <Paperclip className="h-4 w-4" /> {busy ? "Uploading…" : "Add ID proof"}
          </Btn>
        </div>
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-slate-400">No ID proofs attached yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {docs.map((d) => {
            const url = `/api/admin/bookings/${bookingId}/documents/${d.id}`;
            const isImage = d.mimeType.startsWith("image/");
            return (
              <li key={d.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <a href={url} target="_blank" rel="noopener noreferrer" className="block bg-slate-100">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={d.fileName} loading="lazy" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 w-full flex-col items-center justify-center gap-1 text-slate-500">
                      <FileText className="h-8 w-8" />
                      <span className="text-xs font-medium">PDF</span>
                    </div>
                  )}
                </a>
                <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-slate-700" title={d.fileName}>{d.fileName}</div>
                    <div className="text-[11px] text-slate-400">{fmtSize(d.sizeBytes)}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${d.fileName}`}
                    onClick={() => remove(d)}
                    className="flex-shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
