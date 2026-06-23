"use client";

import { useState } from "react";
import { Btn, Modal, Field, inputCls, api } from "@/components/admin/ui";

export function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
      <dd className="mt-0.5 text-slate-800">{v}</dd>
    </div>
  );
}

export function PayModal({
  kind, bookingId, onClose, onSaved,
}: {
  kind: "payment" | "refund";
  bookingId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    amount: "",
    method: "cash",
    reference: "",
    note: "",
    paidOn: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/bookings/${bookingId}/payments`, {
        method: "POST",
        body: JSON.stringify({ ...f, kind, amount: Number(f.amount) }),
      });
      onSaved();
    } catch (er) {
      setError(er instanceof Error ? er.message : "Failed");
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={kind === "refund" ? "Record refund" : "Record payment"}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Amount (₹)" required>
          <input
            type="number" min={1} value={f.amount} required autoFocus
            onChange={(e) => set("amount", e.target.value)}
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Method">
            <select value={f.method} onChange={(e) => set("method", e.target.value)} className={inputCls}>
              {["cash", "upi", "bank", "card", "other"].map((m) => (
                <option key={m} value={m} className="capitalize">{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input
              type="date" value={f.paidOn}
              onChange={(e) => set("paidOn", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Reference">
          <input
            value={f.reference} placeholder="UPI ref, receipt no…"
            onChange={(e) => set("reference", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Note">
          <input
            value={f.note}
            onChange={(e) => set("note", e.target.value)}
            className={inputCls}
          />
        </Field>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" variant={kind === "refund" ? "danger" : "primary"} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

export function CancelModal({
  bookingId, onClose, onSaved,
}: {
  bookingId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled", cancelReason: reason }),
      });
      onSaved();
    } catch {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Cancel booking">
      <p className="mb-4 text-sm text-slate-600">
        This marks the booking cancelled and frees its dates. Record any refund separately.
      </p>
      <Field label="Reason">
        <textarea
          rows={3} value={reason} placeholder="Guest cancelled, no-show…"
          onChange={(e) => setReason(e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Btn variant="outline" onClick={onClose}>Keep booking</Btn>
        <Btn variant="danger" onClick={save} disabled={saving}>
          {saving ? "Cancelling…" : "Cancel booking"}
        </Btn>
      </div>
    </Modal>
  );
}

export function EditBookingModal({
  booking, villas, bookingId, onClose, onSaved,
}: {
  booking: Record<string, unknown> & { reference: string; villa_id: number; status: string };
  villas: { id: number; name: string }[];
  bookingId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Record<string, unknown>>({
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
  const set = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  async function save(allowOverlap = false) {
    setSaving(true);
    setError("");
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
      setError(msg);
      setSaving(false);
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
            <select
              value={String(f.villaId)} required
              onChange={(e) => set("villaId", e.target.value)}
              className={inputCls}
            >
              {villas.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={String(f.status)}
              onChange={(e) => set("status", e.target.value)}
              className={inputCls}
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="Guest name" required>
            <input
              value={String(f.guestName)} required
              onChange={(e) => set("guestName", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={String(f.guestPhone)}
              onChange={(e) => set("guestPhone", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Alternate phone">
            <input
              value={String(f.guestPhone2)}
              onChange={(e) => set("guestPhone2", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Email">
            <input
              type="email" value={String(f.guestEmail)}
              onChange={(e) => set("guestEmail", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Source">
            <input
              value={String(f.source)}
              onChange={(e) => set("source", e.target.value)}
              className={inputCls}
            />
          </Field>
          <div />
          <Field label="Check-in" required>
            <input
              type="date" value={String(f.checkIn)} required
              onChange={(e) => set("checkIn", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Check-out" required>
            <input
              type="date" value={String(f.checkOut)} required
              onChange={(e) => set("checkOut", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Adults">
            <input
              type="number" min={1} value={String(f.adults)}
              onChange={(e) => set("adults", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Children">
            <input
              type="number" min={0} value={String(f.children)}
              onChange={(e) => set("children", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Total amount (₹)">
            <input
              type="number" min={0} value={String(f.totalAmount)}
              onChange={(e) => set("totalAmount", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            rows={2} value={String(f.notes)}
            onChange={(e) => set("notes", e.target.value)}
            className={inputCls}
          />
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

export function DeleteBookingModal({
  reference, bookingId, onClose, onDeleted,
}: {
  reference: string;
  bookingId: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function del() {
    setDeleting(true);
    setError("");
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
        <Btn variant="danger" onClick={del} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete permanently"}
        </Btn>
      </div>
    </Modal>
  );
}
