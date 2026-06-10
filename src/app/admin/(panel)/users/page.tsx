"use client";

import { useEffect, useState } from "react";
import { Card, Btn, Modal, Field, inputCls, fmtDate, api } from "@/components/admin/ui";
import { useCan, useAdmin } from "@/components/admin/AdminShell";
import { Plus, Pencil } from "lucide-react";

export default function UsersPage() {
  const me = useAdmin();
  const canManage = useCan("users.manage");
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [modal, setModal] = useState<null | { mode: "new" | "edit"; user?: any }>(null);

  async function load() {
    const [u, r] = await Promise.all([api("/api/admin/users"), api("/api/admin/roles")]);
    setUsers(u.users || []); setRoles(r.roles || []);
  }
  useEffect(() => { load().catch(() => {}); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        {canManage && <Btn onClick={() => setModal({ mode: "new" })}><Plus className="h-4 w-4" /> Add user</Btn>}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th><th className="px-5 py-3">Last login</th><th className="px-5 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium">{u.name}{u.id === me?.id && <span className="ml-2 text-xs text-emerald-600">(you)</span>}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{u.roleName}</span></td>
                <td className="px-5 py-3">{u.isActive ? <span className="text-emerald-700">Active</span> : <span className="text-red-500">Disabled</span>}</td>
                <td className="px-5 py-3 text-slate-500">{u.lastLoginAt ? fmtDate(u.lastLoginAt) : "Never"}</td>
                <td className="px-5 py-3 text-right">
                  {canManage && <button onClick={() => setModal({ mode: "edit", user: u })} className="text-slate-400 hover:text-emerald-700"><Pencil className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {modal && (
        <UserModal mode={modal.mode} user={modal.user} roles={roles} meId={me?.id}
          onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}

function UserModal({ mode, user, roles, meId, onClose, onSaved }: any) {
  const [f, setF] = useState({
    name: user?.name || "", email: user?.email || "", password: "",
    roleId: user?.roleId || roles[0]?.id || "", isActive: user ? !!user.isActive : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (mode === "new") {
        await api("/api/admin/users", { method: "POST", body: JSON.stringify({ ...f, roleId: Number(f.roleId) }) });
      } else {
        const body: any = { name: f.name, roleId: Number(f.roleId), isActive: f.isActive };
        if (f.password) body.password = f.password;
        await api(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (er) { setError(er instanceof Error ? er.message : "Failed"); setSaving(false); }
  }

  async function deactivate() {
    if (!confirm("Disable this user? They won't be able to log in.")) return;
    await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={mode === "new" ? "Add user" : `Edit ${user.name}`}>
      <form onSubmit={save} className="space-y-4">
        <Field label="Full name" required><input value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} required /></Field>
        <Field label="Email" required>
          <input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} className={inputCls} required disabled={mode === "edit"} />
        </Field>
        <Field label={mode === "new" ? "Password" : "New password (leave blank to keep)"} required={mode === "new"}>
          <input type="password" value={f.password} onChange={(e) => set("password", e.target.value)} className={inputCls} minLength={mode === "new" ? 6 : undefined} required={mode === "new"} />
        </Field>
        <Field label="Role" required>
          <select value={f.roleId} onChange={(e) => set("roleId", e.target.value)} className={inputCls}>
            {roles.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
        <div className="flex items-center justify-between pt-2">
          <div>
            {mode === "edit" && user.id !== meId && (
              <Btn variant="danger" size="sm" onClick={deactivate}>Disable user</Btn>
            )}
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" onClick={onClose}>Cancel</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
          </div>
        </div>
      </form>
    </Modal>
  );
}
