"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, Btn, Badge, Modal, Field, inputCls, fmtMoney, fmtDate, nights, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { Plus, Search, Filter } from "lucide-react";

export default function BookingsPage() {
  const canManage = useCan("bookings.manage");
  const [villas, setVillas] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const [fVilla, setFVilla] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSearch, setFSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (fVilla) qs.set("villa", fVilla);
    if (fStatus) qs.set("status", fStatus);
    if (fSearch) qs.set("search", fSearch);
    try {
      const d = await api(`/api/admin/bookings?${qs}`);
      setRows(d.bookings || []);
    } catch { /* */ } finally { setLoading(false); }
  }, [fVilla, fStatus, fSearch]);

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-slate-500">{rows.length} shown</p>
        </div>
        {canManage && (
          <Btn onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New booking</Btn>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={fSearch} onChange={(e) => setFSearch(e.target.value)}
                placeholder="Search guest, phone, reference…"
                className={inputCls + " pl-9"} />
            </div>
          </div>
          <select value={fVilla} onChange={(e) => setFVilla(e.target.value)} className={inputCls + " max-w-[180px]"}>
            <option value="">All villas</option>
            {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={inputCls + " max-w-[160px]"}>
            <option value="">All status</option>
            {["enquiry","confirmed","checked_in","completed","cancelled"].map((s) =>
              <option key={s} value={s} className="capitalize">{s.replace("_"," ")}</option>)}
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Ref</th><th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Villa</th><th className="px-4 py-3">Stay</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">No bookings found.</td></tr>
              ) : rows.map((b) => {
                const bal = Number(b.totalAmount) - Number(b.paid);
                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/admin/bookings/${b.id}`} className="text-emerald-700 hover:underline">{b.reference}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="font-medium hover:text-emerald-700">{b.guestName}</Link>
                      <div className="text-xs text-slate-400">{b.guestPhone || "—"}</div>
                    </td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.villaName}</span></td>
                    <td className="px-4 py-3">
                      <div>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</div>
                      <div className="text-xs text-slate-400">{nights(b.checkIn?.slice(0,10), b.checkOut?.slice(0,10))} nights · {b.adults + b.children} guests</div>
                    </td>
                    <td className="px-4 py-3"><Badge status={b.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(b.totalAmount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{fmtMoney(b.paid)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-medium ${bal > 0 ? "text-amber-600" : "text-slate-400"}`}>{fmtMoney(bal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showNew && (
        <NewBookingModal villas={villas} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />
      )}
    </div>
  );
}

function NewBookingModal({ villas, onClose, onSaved }: { villas: any[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>({
    villaId: villas[0]?.id || "", guestName: "", guestPhone: "", guestEmail: "",
    checkIn: "", checkOut: "", adults: 2, children: 0, status: "confirmed",
    totalAmount: "", source: "direct", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  async function save(allowOverlap = false) {
    setSaving(true); setError("");
    try {
      await api("/api/admin/bookings", {
        method: "POST",
        body: JSON.stringify({ ...f, villaId: Number(f.villaId), adults: Number(f.adults),
          children: Number(f.children), totalAmount: Number(f.totalAmount || 0), allowOverlap }),
      });
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      if (msg.includes("overlap") && !allowOverlap) {
        if (confirm(msg + "\n\nBook anyway?")) return save(true);
      }
      setError(msg); setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="New booking" wide>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Villa" required>
            <select value={f.villaId} onChange={(e) => set("villaId", e.target.value)} className={inputCls} required>
              {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {["enquiry","confirmed","checked_in","completed"].map((s) =>
                <option key={s} value={s} className="capitalize">{s.replace("_"," ")}</option>)}
            </select>
          </Field>
          <Field label="Guest name" required>
            <input value={f.guestName} onChange={(e) => set("guestName", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Phone">
            <input value={f.guestPhone} onChange={(e) => set("guestPhone", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={f.guestEmail} onChange={(e) => set("guestEmail", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Source">
            <input value={f.source} onChange={(e) => set("source", e.target.value)} className={inputCls} placeholder="direct, WhatsApp, OTA…" />
          </Field>
          <Field label="Check-in" required>
            <input type="date" value={f.checkIn} onChange={(e) => set("checkIn", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Check-out" required>
            <input type="date" value={f.checkOut} onChange={(e) => set("checkOut", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Adults">
            <input type="number" min={1} value={f.adults} onChange={(e) => set("adults", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Children">
            <input type="number" min={0} value={f.children} onChange={(e) => set("children", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Total amount (₹)">
            <input type="number" min={0} value={f.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={inputCls} />
        </Field>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Create booking"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
