"use client";

import { useEffect, useState } from "react";
import { Card, Btn, Field, inputCls, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { FileText, Save } from "lucide-react";

interface Settings {
  prefix: string;
  nextNumber: number;
  padding: number;
  terms: string;
}

export default function InvoiceSettingsPage() {
  const canManage = useCan("invoices.manage");
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const d = await api("/api/admin/invoice-settings");
      setS({ prefix: d.prefix, nextNumber: d.nextNumber, padding: d.padding, terms: d.terms ?? "" });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed to load" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (canManage) load(); /* eslint-disable-next-line */ }, [canManage]);

  if (!canManage) {
    return (
      <Card className="p-8 text-center text-slate-500">
        You don&rsquo;t have permission to manage invoice settings.
      </Card>
    );
  }

  if (loading || !s) return <div className="text-slate-400">Loading…</div>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!s) return;
    setSaving(true);
    setMsg(null);
    try {
      await api("/api/admin/invoice-settings", {
        method: "PUT",
        body: JSON.stringify(s),
      });
      setMsg({ kind: "ok", text: "Settings saved." });
    } catch (er) {
      setMsg({ kind: "err", text: er instanceof Error ? er.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  const preview = `${s.prefix}${String(s.nextNumber).padStart(s.padding, "0")}`;
  const afterPreview = `${s.prefix}${String(s.nextNumber + 1).padStart(s.padding, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoice settings</h1>
        <p className="text-sm text-slate-500">
          Control the reference series and the terms &amp; conditions printed on every invoice.
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        {/* Number series */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Reference number</h2>
            <div className="space-y-4">
              <Field label="Prefix" required>
                <input
                  value={s.prefix}
                  onChange={(e) => setS({ ...s, prefix: e.target.value })}
                  className={inputCls}
                  maxLength={20}
                  placeholder="e.g. KV- or INV/2026/"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Goes in front of the number. Up to 20 characters. Slashes, dashes, and letters are fine.
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Next number" required>
                  <input
                    type="number"
                    min={1}
                    value={s.nextNumber}
                    onChange={(e) => setS({ ...s, nextNumber: Number(e.target.value) })}
                    className={inputCls}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    The number the next new booking will use.
                  </p>
                </Field>
                <Field label="Padding (digits)" required>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={s.padding}
                    onChange={(e) => setS({ ...s, padding: Number(e.target.value) })}
                    className={inputCls}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Pads with leading zeros, e.g. 5 → 00001.
                  </p>
                </Field>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileText className="h-4 w-4 text-emerald-700" />
              Preview
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Next booking</div>
                <div className="mt-1 font-mono text-lg font-semibold text-slate-900">{preview}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">After that</div>
                <div className="mt-1 font-mono text-sm text-slate-500">{afterPreview}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Terms & conditions */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-700">Terms &amp; conditions</h2>
          <p className="mt-1 text-xs text-slate-500">
            Printed on a separate second page of every invoice (PDF and Word). Leave blank to omit the
            page entirely. Each line becomes its own line on the invoice; leave an empty line for a gap.
          </p>
          <textarea
            value={s.terms}
            onChange={(e) => setS({ ...s, terms: e.target.value })}
            className={inputCls + " mt-3 min-h-[260px] font-mono text-xs leading-relaxed"}
            placeholder={`1. Check-in from 2:00 PM; check-out by 11:00 AM.\n2. A valid government photo ID is required at check-in.\n3. The advance paid is non-refundable on cancellation.\n4. Guests are liable for any damage to villa property.\n5. Smoking is not permitted indoors.`}
          />
          <div className="mt-1 text-right text-xs text-slate-400">
            {s.terms.length.toLocaleString()} / 20,000 characters
          </div>
        </Card>

        {msg && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Number changes affect <strong>new</strong> bookings only. Terms apply to every invoice
            (existing and new) the moment you save.
          </p>
          <Btn type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </Btn>
        </div>
      </form>
    </div>
  );
}
