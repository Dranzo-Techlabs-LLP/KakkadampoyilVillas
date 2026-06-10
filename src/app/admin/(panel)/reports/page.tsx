"use client";

import { useEffect, useState } from "react";
import { Card, Btn, api, fmtMoney } from "@/components/admin/ui";
import { Download, FileText } from "lucide-react";

function monthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function today() { return new Date().toISOString().slice(0,10); }

const TYPES = [
  { key: "bookings", label: "Bookings", desc: "All bookings with guest, stay, totals and amount paid." },
  { key: "payments", label: "Payments & Refunds", desc: "Every payment and refund line in the period." },
  { key: "expenses", label: "Expenses", desc: "Operating expenses by villa and category." },
];

export default function ReportsPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [villa, setVilla] = useState("");
  const [villas, setVillas] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ type: string; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);

  function qs(extra?: Record<string, string>) {
    const p = new URLSearchParams({ from, to, ...extra });
    if (villa) p.set("villa", villa);
    return p.toString();
  }

  async function showPreview(type: string) {
    setLoading(true);
    try { const d = await api(`/api/admin/reports?${qs({ type })}`); setPreview({ type, rows: d.rows || [] }); }
    catch { /* */ } finally { setLoading(false); }
  }

  function download(type: string) {
    window.open(`/api/admin/reports?${qs({ type, format: "csv" })}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm"><span className="mb-1 block text-xs text-slate-500">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-sm"><span className="mb-1 block text-xs text-slate-500">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="text-sm"><span className="mb-1 block text-xs text-slate-500">Villa</span>
            <select value={villa} onChange={(e) => setVilla(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">All villas</option>
              {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select></label>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {TYPES.map((t) => (
          <Card key={t.key} className="flex flex-col p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-emerald-600" />{t.label}</div>
            <p className="mb-4 flex-1 text-sm text-slate-500">{t.desc}</p>
            <div className="flex gap-2">
              <Btn size="sm" variant="outline" onClick={() => showPreview(t.key)}>Preview</Btn>
              <Btn size="sm" onClick={() => download(t.key)}><Download className="h-4 w-4" /> CSV</Btn>
            </div>
          </Card>
        ))}
      </div>

      {loading && <div className="text-sm text-slate-400">Loading preview…</div>}

      {preview && !loading && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <span className="text-sm font-semibold capitalize text-slate-700">{preview.type} · {preview.rows.length} rows</span>
            <Btn size="sm" onClick={() => download(preview.type)}><Download className="h-4 w-4" /> Download CSV</Btn>
          </div>
          {preview.rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No data in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>{Object.keys(preview.rows[0]).map((h) => <th key={h} className="whitespace-nowrap px-4 py-2.5">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.entries(r).map(([k, v]) => (
                        <td key={k} className="whitespace-nowrap px-4 py-2.5">
                          {["Total","Paid","Amount"].includes(k) ? fmtMoney(v as any) : String(v ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 100 && <p className="p-3 text-center text-xs text-slate-400">Showing first 100 — download CSV for all {preview.rows.length}.</p>}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
