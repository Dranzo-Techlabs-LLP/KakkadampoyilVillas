"use client";

import { useEffect, useState } from "react";
import { Card, Btn, api, fmtMoney } from "@/components/admin/ui";
import { Download, FileText, Printer } from "lucide-react";

function monthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function today() { return new Date().toISOString().slice(0,10); }

const TYPES = [
  { key: "bookings", label: "Bookings", desc: "All bookings with guest, stay, totals and amount paid." },
  { key: "payments", label: "Payments & Refunds", desc: "Every payment and refund line in the period." },
  { key: "expenses", label: "Expenses", desc: "Operating expenses by villa and category." },
  { key: "combined", label: "Combined Report", desc: "Cash book: payments in, refunds + expenses out, with running balance." },
];

const MONEY_KEYS = new Set(["Total", "Paid", "Amount", "Cash in", "Cash out", "Balance"]);
// Columns that get a dropdown of distinct values (low-cardinality / categorical).
// Source is intentionally a free-text filter so "!term" negation is typable.
const SELECT_KEYS = new Set(["Villa", "Status", "Method", "Kind", "Category", "Mode", "Entry by"]);

// A single cell matches a filter value. Supports "!term" (exclude) and plain
// substring (include), case-insensitive. Multiple !terms can be comma-separated.
function cellMatches(cell: string, filter: string) {
  const c = cell.toLowerCase();
  const f = filter.trim().toLowerCase();
  if (!f) return true;
  if (f.startsWith("!")) {
    // exclude if the cell contains ANY of the negated terms
    const terms = f.slice(1).split(",").map((t) => t.trim()).filter(Boolean);
    return !terms.some((t) => c.includes(t));
  }
  return c.includes(f);
}

// Recompute credited / debited / overall from an arbitrary row subset,
// mirroring the API totals so column filters update the summary live.
function computeTotals(type: string, rows: any[]) {
  const sum = (fn: (r: any) => number) => rows.reduce((s, r) => s + (fn(r) || 0), 0);
  let credited = 0, debited = 0;
  if (type === "combined") {
    credited = sum((r) => Number(r["Cash in"]));
    debited = sum((r) => Number(r["Cash out"]));
  } else if (type === "payments") {
    credited = sum((r) => (r.Kind === "payment" ? Number(r.Amount) : 0));
    debited = sum((r) => (r.Kind === "refund" ? Number(r.Amount) : 0));
  } else if (type === "expenses") {
    debited = sum((r) => Number(r.Amount));
  } else if (type === "bookings") {
    credited = sum((r) => Number(r.Paid));
  }
  return { credited, debited, overall: credited - debited, entries: rows.length };
}

export default function ReportsPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [villa, setVilla] = useState("");
  const [basis, setBasis] = useState<"stay" | "cash">("stay");
  const [villas, setVillas] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ type: string; rows: any[]; totals?: { credited: number; debited: number; overall: number; entries: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);

  function qs(extra?: Record<string, string>) {
    const p = new URLSearchParams({ from, to, basis, ...extra });
    if (villa) p.set("villa", villa);
    return p.toString();
  }

  async function showPreview(type: string) {
    setLoading(true);
    setColFilters({});
    try { const d = await api(`/api/admin/reports?${qs({ type })}`); setPreview({ type, rows: d.rows || [], totals: d.totals }); }
    catch { /* */ } finally { setLoading(false); }
  }

  function download(type: string) {
    window.open(`/api/admin/reports?${qs({ type, format: "csv" })}`, "_blank");
  }

  function openPrint() {
    const p = new URLSearchParams({ from, to, basis });
    if (villa) p.set("villa", villa);
    window.open(`/admin/reports/combined/print?${p}`, "_blank");
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
          <div className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Period basis</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5">
              {([["stay", "Stay month"], ["cash", "Cash date"]] as const).map(([k, lbl]) => (
                <button key={k} type="button" onClick={() => setBasis(k)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${basis === k ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {basis === "stay"
            ? "Stay month — a transaction counts in the month the guest checks in (advances paid in another month still count toward the stay)."
            : "Cash date — a transaction counts in the month the money actually moved; advances for other months are excluded."}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t) => (
          <Card key={t.key} className="flex flex-col p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-emerald-600" />{t.label}</div>
            <p className="mb-4 flex-1 text-sm text-slate-500">{t.desc}</p>
            <div className="flex gap-2">
              <Btn size="sm" variant="outline" onClick={() => showPreview(t.key)}>Preview</Btn>
              {t.key === "combined" ? (
                <Btn size="sm" onClick={openPrint}><Printer className="h-4 w-4" /> PDF</Btn>
              ) : (
                <Btn size="sm" onClick={() => download(t.key)}><Download className="h-4 w-4" /> CSV</Btn>
              )}
            </div>
          </Card>
        ))}
      </div>

      {loading && <div className="text-sm text-slate-400">Loading preview…</div>}

      {(() => {
        if (!preview || loading) return null;
        const cols = preview.rows.length ? Object.keys(preview.rows[0]) : [];
        const activeFilters = Object.entries(colFilters).filter(([, v]) => v);
        const filtered = preview.rows.filter((r) =>
          activeFilters.every(([k, v]) => cellMatches(String(r[k] ?? ""), v))
        );
        const totals = computeTotals(preview.type, filtered);
        const distinct = (k: string) =>
          [...new Set(preview.rows.map((r) => String(r[k] ?? "")).filter(Boolean))].sort();

        return (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Total Credited</div>
                <div className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">{fmtMoney(totals.credited)}</div>
                <div className="mt-0.5 text-xs text-slate-400">money in</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Total Debited</div>
                <div className="mt-1 text-2xl font-semibold text-red-600 tabular-nums">{fmtMoney(totals.debited)}</div>
                <div className="mt-0.5 text-xs text-slate-400">refunds + expenses out</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Overall Total</div>
                <div className={`mt-1 text-2xl font-semibold tabular-nums ${totals.overall >= 0 ? "text-slate-800" : "text-red-600"}`}>{fmtMoney(totals.overall)}</div>
                <div className="mt-0.5 text-xs text-slate-400">credited − debited</div>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-3">
                <span className="text-sm font-semibold capitalize text-slate-700">
                  {preview.type} · {filtered.length}{activeFilters.length ? ` of ${preview.rows.length}` : ""} {preview.type === "combined" ? "entries" : "rows"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-slate-400 sm:inline">Tip: type <code className="rounded bg-slate-100 px-1">!b2b</code> to exclude</span>
                  {activeFilters.length > 0 && (
                    <button onClick={() => setColFilters({})} className="text-xs text-slate-500 underline hover:text-slate-800">Clear filters</button>
                  )}
                  {preview.type === "combined" ? (
                    <Btn size="sm" onClick={openPrint}><Printer className="h-4 w-4" /> Download PDF</Btn>
                  ) : (
                    <Btn size="sm" onClick={() => download(preview.type)}><Download className="h-4 w-4" /> Download CSV</Btn>
                  )}
                </div>
              </div>
              {preview.rows.length === 0 ? (
                <p className="p-8 text-center text-sm text-slate-400">No data in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                      <tr>{cols.map((h) => (
                        <th key={h} className={`whitespace-nowrap px-4 py-2.5 ${MONEY_KEYS.has(h) ? "text-right" : ""}`}>{h}</th>
                      ))}</tr>
                      {/* Per-column filter row */}
                      <tr className="bg-white">
                        {cols.map((h) => (
                          <th key={h} className="px-3 py-2 align-top font-normal normal-case">
                            {SELECT_KEYS.has(h) ? (
                              <select
                                value={colFilters[h] || ""}
                                onChange={(e) => setColFilters((p) => ({ ...p, [h]: e.target.value }))}
                                className="w-full min-w-[110px] rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700">
                                <option value="">All</option>
                                {distinct(h).map((v) => <option key={v} value={v}>{v}</option>)}
                              </select>
                            ) : MONEY_KEYS.has(h) ? null : (
                              <input
                                value={colFilters[h] || ""}
                                onChange={(e) => setColFilters((p) => ({ ...p, [h]: e.target.value }))}
                                placeholder={h === "Source" ? "e.g. rahim  ·  !b2b" : "filter… !exclude"}
                                title={'Type text to match. Prefix with "!" to exclude (e.g. !b2b). Comma-separate multiple: !b2b,cash'}
                                className="w-full min-w-[90px] rounded-md border border-slate-300 px-2 py-1 text-xs" />
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.length === 0 ? (
                        <tr><td colSpan={cols.length} className="p-6 text-center text-sm text-slate-400">No rows match the filters.</td></tr>
                      ) : filtered.slice(0, 200).map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          {Object.entries(r).map(([k, v]) => {
                            const isMoney = MONEY_KEYS.has(k);
                            const num = isMoney ? Number(v) : 0;
                            const blankZero = isMoney && (k === "Cash in" || k === "Cash out") && num === 0;
                            let cls = "whitespace-nowrap px-4 py-2.5";
                            if (isMoney) cls += " text-right tabular-nums";
                            if (k === "Cash in" && num > 0) cls += " text-emerald-700 font-medium";
                            if (k === "Cash out" && num > 0) cls += " text-red-600 font-medium";
                            return (
                              <td key={k} className={cls}>
                                {blankZero ? "" : isMoney ? fmtMoney(v as any) : String(v ?? "—")}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 200 && <p className="p-3 text-center text-xs text-slate-400">Showing first 200 — download CSV for all {filtered.length}.</p>}
                </div>
              )}
            </Card>
          </>
        );
      })()}
    </div>
  );
}
