"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Stat, Btn, fmtMoney, api } from "@/components/admin/ui";

function monthStart() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`; }
function today() { return new Date().toISOString().slice(0,10); }

export default function AccountingPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [villa, setVilla] = useState("");
  const [villas, setVillas] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ from, to });
    if (villa) qs.set("villa", villa);
    try { setData(await api(`/api/admin/accounting?${qs}`)); }
    catch { /* */ } finally { setLoading(false); }
  }, [from, to, villa]);
  useEffect(() => { load(); }, [load]);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Accounting</h1>

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

      {loading || !s ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Collected" value={fmtMoney(s.collected)} tone="green" sub="received from guests" />
            <Stat label="Refunded" value={fmtMoney(s.refunded)} tone="red" sub="paid back" />
            <Stat label="B2B commission" value={fmtMoney(s.b2b || 0)} tone="amber" sub="paid to partners" />
            <Stat label="Net revenue" value={fmtMoney(s.netRevenue)} tone="green" sub="collected − refunds − B2B" />
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Expenses" value={fmtMoney(s.expenses)} tone="amber" sub="operating (excl. B2B)" />
            <Stat label="Profit" value={fmtMoney(s.profit)} tone={s.profit >= 0 ? "green" : "red"} sub="net revenue − expenses" />
            <Stat label="Contracted value" value={fmtMoney(s.contracted)} sub="booking totals in period" />
            <Stat label="Outstanding" value={fmtMoney(s.contracted - s.netRevenue)} tone="amber" sub="contracted − net revenue" />
          </div>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Per-villa breakdown</div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-5 py-2.5">Villa</th><th className="px-5 py-2.5 text-right">Revenue</th>
                  <th className="px-5 py-2.5 text-right">Expenses</th><th className="px-5 py-2.5 text-right">Profit</th>
                  <th className="px-5 py-2.5 text-right">Bookings</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.perVilla.map((v: any) => {
                  const profit = Number(v.revenue) - Number(v.expenses);
                  return (
                    <tr key={v.id}>
                      <td className="px-5 py-3"><span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: v.color }} />{v.name}</span></td>
                      <td className="px-5 py-3 text-right tabular-nums text-emerald-700">{fmtMoney(v.revenue)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-amber-600">{fmtMoney(v.expenses)}</td>
                      <td className={`px-5 py-3 text-right tabular-nums font-medium ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmtMoney(profit)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{v.bookings}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
