"use client";

import { useEffect, useState } from "react";
import { Card, Btn, Modal, Field, inputCls, fmtMoney, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { Pencil } from "lucide-react";

export default function VillasPage() {
  const canManage = useCan("villas.manage");
  const [villas, setVillas] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);

  async function load() { const d = await api("/api/admin/villas"); setVillas(d.villas || []); }
  useEffect(() => { load().catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Villas</h1>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {villas.map((v) => (
          <Card key={v.id} className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-4 rounded-full" style={{ background: v.color }} />
                <div>
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-slate-400">{v.slug}</div>
                </div>
              </div>
              {canManage && <button onClick={() => setEdit(v)} className="text-slate-400 hover:text-emerald-700"><Pencil className="h-4 w-4" /></button>}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Capacity</dt><dd>{v.capacity} guests</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Bedrooms</dt><dd>{v.bedrooms}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Base rate</dt><dd>{fmtMoney(v.baseRate)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd>{v.isActive ? <span className="text-emerald-700">Active</span> : <span className="text-slate-400">Inactive</span>}</dd></div>
            </dl>
          </Card>
        ))}
      </div>

      {edit && <EditVilla villa={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function EditVilla({ villa, onClose, onSaved }: { villa: any; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ ...villa });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await api("/api/admin/villas", { method: "PATCH", body: JSON.stringify({
        id: f.id, name: f.name, capacity: Number(f.capacity), bedrooms: Number(f.bedrooms),
        baseRate: Number(f.baseRate), color: f.color, isActive: !!f.isActive }) });
      onSaved();
    } catch { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title={`Edit ${villa.name}`}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Name"><input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacity"><input type="number" value={f.capacity} onChange={(e) => set("capacity", e.target.value)} className={inputCls} /></Field>
          <Field label="Bedrooms"><input type="number" value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={inputCls} /></Field>
          <Field label="Base rate (₹)"><input type="number" value={f.baseRate} onChange={(e) => set("baseRate", e.target.value)} className={inputCls} /></Field>
          <Field label="Calendar colour"><input type="color" value={f.color} onChange={(e) => set("color", e.target.value)} className="h-10 w-full rounded-lg border border-slate-300" /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
