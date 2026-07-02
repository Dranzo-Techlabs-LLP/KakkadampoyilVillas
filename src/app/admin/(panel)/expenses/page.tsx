"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Btn, Modal, Field, inputCls, fmtMoney, fmtDate, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { Plus, Trash2 } from "lucide-react";

const CATEGORIES = ["Maintenance","Staff","Utilities","Supplies","Food","Cleaning","Repairs","Marketing","Tax","B2B Commission","Other"];

export default function ExpensesPage() {
  const canManage = useCan("expenses.manage");
  const [villas, setVillas] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [fVilla, setFVilla] = useState("");

  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);
  useEffect(() => { api("/api/admin/bookings").then((d) => setBookings(d.bookings || [])).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (fVilla) qs.set("villa", fVilla);
    try { const d = await api(`/api/admin/expenses?${qs}`); setRows(d.expenses || []); }
    catch { /* */ } finally { setLoading(false); }
  }, [fVilla]);
  useEffect(() => { load(); }, [load]);

  const total = rows.reduce((s, r) => s + Number(r.amount), 0);

  async function del(id: number) {
    if (!confirm("Delete this expense?")) return;
    await api(`/api/admin/expenses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-slate-500">Total shown: <span className="font-medium text-amber-600">{fmtMoney(total)}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <select value={fVilla} onChange={(e) => setFVilla(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All villas</option>
            {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {canManage && <Btn onClick={() => setShow(true)}><Plus className="h-4 w-4" /> Add expense</Btn>}
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Villa</th>
              <th className="px-5 py-3">Booking</th>
              <th className="px-5 py-3">Description</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-400">No expenses recorded.</td></tr>
              : rows.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">{fmtDate(e.spentOn)}</td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${e.category === "B2B Commission" ? "bg-purple-100 text-purple-700" : "bg-slate-100"}`}>{e.category}</span></td>
                  <td className="px-5 py-3 text-slate-600">{e.villaName || "—"}</td>
                  <td className="px-5 py-3">{e.bookingRef ? <a href={`/admin/bookings/${e.bookingId}`} className="font-mono text-xs text-emerald-700 hover:underline">{e.bookingRef}</a> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-3 text-slate-600">{e.description || "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium text-amber-600">{fmtMoney(e.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    {canManage && <button onClick={() => del(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {show && <AddExpense villas={villas} bookings={bookings} onClose={() => setShow(false)} onSaved={() => { setShow(false); load(); }} />}
    </div>
  );
}

function AddExpense({ villas, bookings, onClose, onSaved }: { villas: any[]; bookings: any[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ villaId: "", bookingId: "", category: "Maintenance", amount: "", description: "", spentOn: new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api("/api/admin/expenses", { method: "POST", body: JSON.stringify({
        ...f,
        villaId: f.villaId ? Number(f.villaId) : null,
        bookingId: f.bookingId ? Number(f.bookingId) : null,
        amount: Number(f.amount),
      }) });
      onSaved();
    } catch (er) { setError(er instanceof Error ? er.message : "Failed"); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title="Add expense">
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount (₹)" required><input type="number" min={1} value={f.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} required autoFocus /></Field>
          <Field label="Date"><input type="date" value={f.spentOn} onChange={(e) => set("spentOn", e.target.value)} className={inputCls} /></Field>
          <Field label="Category">
            <select value={f.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Villa (optional)">
            <select value={f.villaId} onChange={(e) => set("villaId", e.target.value)} className={inputCls}>
              <option value="">General / all</option>
              {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Link to booking (optional)">
          <select value={f.bookingId} onChange={(e) => set("bookingId", e.target.value)} className={inputCls}>
            <option value="">Not linked</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>{b.reference} · {b.guestName} · {b.villaName}</option>
            ))}
          </select>
        </Field>
        <Field label="Description"><input value={f.description} onChange={(e) => set("description", e.target.value)} className={inputCls} /></Field>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Add expense"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
