"use client";

import { useEffect, useState } from "react";
import { Card, Btn, Modal, Field, inputCls, api } from "@/components/admin/ui";
import { useCan } from "@/components/admin/AdminShell";
import { Plus, ShieldCheck, Save } from "lucide-react";

export default function RolesPage() {
  const canManage = useCan("users.manage");
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [matrix, setMatrix] = useState<Record<number, string[]>>({});
  const [activeRole, setActiveRole] = useState<number | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function load() {
    const d = await api("/api/admin/roles");
    setRoles(d.roles || []); setPermissions(d.permissions || []); setMatrix(d.matrix || {});
    if (d.roles?.length && activeRole == null) selectRole(d.roles[0].id, d.matrix);
  }
  useEffect(() => { load().catch(() => {}); /* eslint-disable-next-line */ }, []);

  function selectRole(id: number, m = matrix) {
    setActiveRole(id);
    setDraft(new Set(m[id] || []));
    setDirty(false);
  }

  function toggle(key: string) {
    if (!canManage) return;
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setDirty(true);
  }

  async function save() {
    if (activeRole == null) return;
    setSaving(true);
    try {
      await api("/api/admin/roles", { method: "PATCH", body: JSON.stringify({ roleId: activeRole, keys: [...draft] }) });
      await load();
      setDirty(false);
    } catch { /* */ } finally { setSaving(false); }
  }

  // Group permissions by category
  const groups = permissions.reduce((acc: Record<string, any[]>, p) => {
    (acc[p.category] ||= []).push(p); return acc;
  }, {});

  const role = roles.find((r) => r.id === activeRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Roles &amp; rights</h1>
          <p className="text-sm text-slate-500">Control which features each role can see and use.</p>
        </div>
        {canManage && <Btn onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New role</Btn>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Role list */}
        <Card className="h-fit p-2">
          {roles.map((r) => (
            <button key={r.id} onClick={() => { if (dirty && !confirm("Discard unsaved changes?")) return; selectRole(r.id); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm ${activeRole === r.id ? "bg-emerald-700 text-white" : "hover:bg-slate-100"}`}>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                <span className="font-medium">{r.name}</span>
                {r.isSystem ? <span className={`ml-1 text-xs ${activeRole === r.id ? "text-emerald-200" : "text-slate-400"}`}>· system</span> : null}
              </span>
              <span className={`text-xs ${activeRole === r.id ? "text-emerald-200" : "text-slate-400"}`}>{(matrix[r.id] || []).length}</span>
            </button>
          ))}
        </Card>

        {/* Permission matrix */}
        <Card className="p-5">
          {role ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{role.name}</h2>
                  {role.description && <p className="text-sm text-slate-500">{role.description}</p>}
                </div>
                {canManage && (
                  <Btn onClick={save} disabled={!dirty || saving}><Save className="h-4 w-4" /> {saving ? "Saving…" : "Save rights"}</Btn>
                )}
              </div>

              <div className="space-y-5">
                {Object.entries(groups).map(([cat, perms]) => (
                  <div key={cat}>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(perms as any[]).map((p) => (
                        <label key={p.key}
                          className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${draft.has(p.key) ? "border-emerald-300 bg-emerald-50" : "border-slate-200"} ${canManage ? "cursor-pointer" : "cursor-default opacity-90"}`}>
                          <input type="checkbox" checked={draft.has(p.key)} onChange={() => toggle(p.key)} disabled={!canManage}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500" />
                          <span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {dirty && <p className="mt-4 text-xs text-amber-600">Unsaved changes — click “Save rights”.</p>}
            </>
          ) : <p className="text-slate-400">Select a role.</p>}
        </Card>
      </div>

      {showNew && <NewRole onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
}

function NewRole({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try { await api("/api/admin/roles", { method: "POST", body: JSON.stringify({ name, description }) }); onSaved(); }
    catch { setSaving(false); }
  }
  return (
    <Modal open onClose={onClose} title="New role">
      <form onSubmit={save} className="space-y-4">
        <Field label="Role name" required><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required /></Field>
        <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} /></Field>
        <p className="text-xs text-slate-400">Create the role, then tick its permissions in the matrix.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? "Creating…" : "Create role"}</Btn>
        </div>
      </form>
    </Modal>
  );
}
