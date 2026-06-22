"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Btn, Badge, Modal, Field, inputCls, fmtMoney, fmtDate, nights, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { ArrowLeft, Plus, RotateCcw, XCircle, Pencil, Trash2 } from "lucide-react";

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const canManage = useCan("bookings.manage");
  const canCancel = useCan("bookings.cancel");
  const canPay = useCan("payments.manage");

  const [data, setData] = useState<any>(null);
  const [villas, setVillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<null | "payment" | "refund">(null);
  const [cancelModal, setCancelModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

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
            <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="tabular-nums text-emerald-700">{fmtMoney(paid)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="font-medium">Balance</span>
              <span className={`font-semibold tabular-nums ${balance > 0 ? "text-amber-600" : "text-emerald-700"}`}>{fmtMoney(balance)}</span>
            </div>
          </div>
          {canPay && b.status !== "cancelled" && (
            <div className="mt-5 flex gap-2">
              <Btn size="sm" onClick={() => setPayModal("payment")}><Plus className="h-4 w-4" /> Payment</Btn>
              <Btn size="sm" variant="outline" onClick={() => setPayModal("refund")}><RotateCcw className="h-4 w-4" /> Refund</Btn>
            </div>
          )}
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
              <tr><th className="px-5 py-2.5">Date</th><th className="px-5 py-2.5">Type</th><th className="px-5 py-2.5">Method</th><th className="px-5 py-2.5">Reference</th><th className="px-5 py-2.5 text-right">Amount</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-2.5">{fmtDate(p.paidOn)}</td>
                  <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.kind === "refund" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-800"}`}>{p.kind}</span></td>
                  <td className="px-5 py-2.5 capitalize">{p.method}</td>
                  <td className="px-5 py-2.5 text-slate-500">{p.reference || "—"}</td>
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
    </div>
  );
}

function Info({ k, v }: { k: string; v: any }) {
  return <div><dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt><dd className="mt-0.5 text-slate-800">{v}</dd></div>;
}

function PayModal({ kind, bookingId, onClose, onSaved }: { kind: "payment" | "refund"; bookingId: string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ amount: "", method: "cash", reference: "", note: "", paidOn: new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api(`/api/admin/bookings/${bookingId}/payments`, {
        method: "POST", body: JSON.stringify({ ...f, kind, amount: Number(f.amount) }),
      });
      onSaved();
    } catch (er) { setError(er instanceof Error ? er.message : "Failed"); setSaving(false); }
  }

  return (
    <Modal open onClose={onClose} title={kind === "refund" ? "Record refund" : "Record payment"}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Amount (₹)" required>
          <input type="number" min={1} value={f.amount} onChange={(e) => set("amount", e.target.value)} className={inputCls} required autoFocus />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Method">
            <select value={f.method} onChange={(e) => set("method", e.target.value)} className={inputCls}>
              {["cash","upi","bank","card","other"].map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={f.paidOn} onChange={(e) => set("paidOn", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Reference"><input value={f.reference} onChange={(e) => set("reference", e.target.value)} className={inputCls} placeholder="UPI ref, receipt no…" /></Field>
        <Field label="Note"><input value={f.note} onChange={(e) => set("note", e.target.value)} className={inputCls} /></Field>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant={kind === "refund" ? "danger" : "primary"} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function CancelModal({ bookingId, onClose, onSaved }: { bookingId: string; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try { await api(`/api/admin/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled", cancelReason: reason }) }); onSaved(); }
    catch { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="Cancel booking">
      <p className="mb-4 text-sm text-slate-600">This marks the booking cancelled and frees its dates. Record any refund separately.</p>
      <Field label="Reason"><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} placeholder="Guest cancelled, no-show…" /></Field>
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Keep booking</Btn>
        <Btn variant="danger" onClick={save} disabled={saving}>{saving ? "Cancelling…" : "Cancel booking"}</Btn>
      </div>
    </Modal>
  );
}

function EditBookingModal({
  booking, villas, bookingId, onClose, onSaved,
}: {
  booking: any; villas: any[]; bookingId: string; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<any>({
    villaId: booking.villa_id,
    guestName: booking.guest_name || "",
    guestPhone: booking.guest_phone || "",
    guestPhone2: booking.guest_phone2 || "",
    guestEmail: booking.guest_email || "",
    checkIn: String(booking.check_in || "").slice(0, 10),
    checkOut: String(booking.check_out || "").slice(0, 10),
    adults: booking.adults,
    children: booking.children,
    status: booking.status,
    totalAmount: booking.total_amount,
    source: booking.source || "direct",
    notes: booking.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  async function save(allowOverlap = false) {
    setSaving(true); setError("");
    try {
      await api(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...f,
          villaId: Number(f.villaId),
          adults: Number(f.adults),
          children: Number(f.children),
          totalAmount: Number(f.totalAmount || 0),
          allowOverlap,
        }),
      });
      onSaved();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      if (msg.toLowerCase().includes("overlap") && !allowOverlap) {
        if (confirm(msg + "\n\nSave anyway?")) return save(true);
      }
      setError(msg); setSaving(false);
    }
  }

  const statuses = booking.status === "cancelled"
    ? ["enquiry", "confirmed", "checked_in", "completed", "cancelled"]
    : ["enquiry", "confirmed", "checked_in", "completed"];

  return (
    <Modal open onClose={onClose} title={`Edit booking · ${booking.reference}`} wide>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Villa" required>
            <select value={f.villaId} onChange={(e) => set("villaId", e.target.value)} className={inputCls} required>
              {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={f.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
              {statuses.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Guest name" required>
            <input value={f.guestName} onChange={(e) => set("guestName", e.target.value)} className={inputCls} required />
          </Field>
          <Field label="Phone">
            <input value={f.guestPhone} onChange={(e) => set("guestPhone", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Alternate phone">
            <input value={f.guestPhone2} onChange={(e) => set("guestPhone2", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Email">
            <input type="email" value={f.guestEmail} onChange={(e) => set("guestEmail", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Source">
            <input value={f.source} onChange={(e) => set("source", e.target.value)} className={inputCls} />
          </Field>
          <div />
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
          <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Btn>
        </div>
      </form>
    </Modal>
  );
}

function DeleteBookingModal({
  reference, bookingId, onClose, onDeleted,
}: {
  reference: string; bookingId: string; onClose: () => void; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  async function del() {
    setDeleting(true); setError("");
    try {
      await api(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setDeleting(false);
    }
  }
  return (
    <Modal open onClose={onClose} title="Delete booking">
      <p className="text-sm text-slate-700">
        Permanently delete booking <span className="font-mono font-semibold">{reference}</span>?
      </p>
      <p className="mt-2 text-sm text-red-600">
        This also deletes all linked payments and refunds. This cannot be undone.
        Consider <em>cancelling</em> instead if you want to keep the record.
      </p>
      {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Keep booking</Btn>
        <Btn variant="danger" onClick={del} disabled={deleting}>{deleting ? "Deleting…" : "Delete permanently"}</Btn>
      </div>
    </Modal>
  );
}
