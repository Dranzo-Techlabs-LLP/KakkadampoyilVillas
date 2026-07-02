"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Btn, Badge, fmtMoney, fmtDate, nights, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { ArrowLeft, Plus, RotateCcw, XCircle, Pencil, Trash2, FileText, Receipt } from "lucide-react";
import {
  Info,
  PayModal,
  CancelModal,
  EditBookingModal,
  DeleteBookingModal,
  BookingExpenseModal,
} from "./Modals";

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const canManage = useCan("bookings.manage");
  const canCancel = useCan("bookings.cancel");
  const canPay = useCan("payments.manage");
  const canExpense = useCan("expenses.manage");

  const [data, setData] = useState<any>(null);
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<null | "payment" | "refund">(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);

  async function load() {
    setLoading(true);
    try { setData(await api(`/api/admin/bookings/${id}`)); }
    catch { /* */ } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => { api("/api/admin/villas").then((d) => setVillas(d.villas || [])).catch(() => {}); }, []);

  if (loading) return <div className="text-slate-400">Loading…</div>;
  if (!data?.booking) return <div className="text-slate-400">Booking not found.</div>;

  const b = data.booking;
  const payments = data.payments || [];
  const paid = payments.reduce((s: number, p: any) => s + (p.kind === "payment" ? Number(p.amount) : -Number(p.amount)), 0);
  const balance = Number(b.total_amount) - paid;
  const b2bTotal = payments.reduce((s: number, p: any) => s + (p.kind === "payment" ? Number(p.b2bAmount || 0) : 0), 0);

  async function setStatus(status: string) {
    await api(`/api/admin/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All bookings
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{b.guest_name}</h1>
            <Badge status={b.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">{b.reference}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && b.status === "confirmed" && <Btn variant="outline" size="sm" onClick={() => setStatus("checked_in")}>Check in</Btn>}
          {canManage && b.status === "checked_in" && <Btn variant="outline" size="sm" onClick={() => setStatus("completed")}>Mark completed</Btn>}
          <Link
            href={`/admin/bookings/${id}/invoice`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> Invoice
          </Link>
          {canManage && (
            <Btn variant="outline" size="sm" onClick={() => setEditModal(true)}><Pencil className="h-4 w-4" /> Edit</Btn>
          )}
          {canCancel && b.status !== "cancelled" && (
            <Btn variant="danger" size="sm" onClick={() => setCancelModal(true)}><XCircle className="h-4 w-4" /> Cancel</Btn>
          )}
          {canManage && (
            <Btn variant="danger" size="sm" onClick={() => setDeleteModal(true)}><Trash2 className="h-4 w-4" /> Delete</Btn>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Booking details */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Booking details</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Info k="Villa" v={<span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />{b.villaName}</span>} />
            <Info k="Source" v={b.source || "—"} />
            <Info k="Check-in" v={fmtDate(b.check_in)} />
            <Info k="Check-out" v={fmtDate(b.check_out)} />
            <Info k="Nights" v={nights(b.check_in?.slice(0,10), b.check_out?.slice(0,10))} />
            <Info k="Guests" v={`${b.adults} adults · ${b.children} children`} />
            <Info k="Phone" v={b.guest_phone || "—"} />
            <Info k="Alternate phone" v={b.guest_phone2 || "—"} />
            <Info k="Email" v={b.guest_email || "—"} />
            {b.notes && <div className="col-span-2"><Info k="Notes" v={b.notes} /></div>}
            {b.cancel_reason && <div className="col-span-2"><Info k="Cancellation reason" v={b.cancel_reason} /></div>}
          </dl>
        </Card>

        {/* Money summary */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Financials</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold tabular-nums">{fmtMoney(b.total_amount)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Received</span><span className="tabular-nums text-emerald-700">{fmtMoney(paid)}</span></div>
            {b2bTotal > 0 && (
              <div className="flex justify-between"><span className="text-slate-500">B2B commission</span><span className="tabular-nums text-purple-600">−{fmtMoney(b2bTotal)}</span></div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="font-medium">Balance</span>
              <span className={`font-semibold tabular-nums ${balance > 0 ? "text-amber-600" : "text-emerald-700"}`}>{fmtMoney(balance)}</span>
            </div>
            {b2bTotal > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Net revenue (excl. B2B)</span>
                <span className="tabular-nums text-slate-600">{fmtMoney(paid - b2bTotal)}</span>
              </div>
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {canPay && b.status !== "cancelled" && (
              <>
                <Btn size="sm" onClick={() => setPayModal("payment")}><Plus className="h-4 w-4" /> Payment</Btn>
                <Btn size="sm" variant="outline" onClick={() => setPayModal("refund")}><RotateCcw className="h-4 w-4" /> Refund</Btn>
              </>
            )}
            {canExpense && (
              <Btn size="sm" variant="outline" onClick={() => setExpenseModal(true)}><Receipt className="h-4 w-4" /> Expense</Btn>
            )}
          </div>
        </Card>
      </div>

      {/* Payments ledger */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Payment ledger</div>
        {payments.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-2.5">Date</th><th className="px-5 py-2.5">Type</th><th className="px-5 py-2.5">Method</th><th className="px-5 py-2.5">Reference</th><th className="px-5 py-2.5 text-right">B2B</th><th className="px-5 py-2.5 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5">{fmtDate(p.paidOn)}</td>
                  <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.kind === "refund" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{p.kind}</span></td>
                  <td className="px-5 py-2.5 capitalize">{p.method}</td>
                  <td className="px-5 py-2.5 text-slate-500">{p.reference || "—"}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-purple-600">{Number(p.b2bAmount) > 0 ? fmtMoney(p.b2bAmount) : "—"}</td>
                  <td className={`px-5 py-2.5 text-right tabular-nums font-medium ${p.kind === "refund" ? "text-red-600" : "text-emerald-700"}`}>
                    {p.kind === "refund" ? "−" : "+"}{fmtMoney(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {payModal && (
        <PayModal kind={payModal} bookingId={id} onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); load(); }} />
      )}
      {cancelModal && (
        <CancelModal bookingId={id} onClose={() => setCancelModal(false)}
          onSaved={() => { setCancelModal(false); load(); }} />
      )}
      {editModal && (
        <EditBookingModal booking={b} villas={villas} bookingId={id}
          onClose={() => setEditModal(false)}
          onSaved={() => { setEditModal(false); load(); }} />
      )}
      {deleteModal && (
        <DeleteBookingModal reference={b.reference} bookingId={id}
          onClose={() => setDeleteModal(false)}
          onDeleted={() => router.push("/admin/bookings")} />
      )}
      {expenseModal && (
        <BookingExpenseModal bookingId={id} villaName={b.villaName} reference={b.reference}
          onClose={() => setExpenseModal(false)}
          onSaved={() => { setExpenseModal(false); load(); }} />
      )}
    </div>
  );
}
