import { NextRequest } from "next/server";
import { exec, q1 } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return guard("users.manage", async (actor) => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");

    const fields: string[] = [];
    const p: any = { id };
    if (b.name) { fields.push("name = :name"); p.name = b.name; }
    if (b.roleId) { fields.push("role_id = :roleId"); p.roleId = b.roleId; }
    if (typeof b.isActive === "boolean") { fields.push("is_active = :active"); p.active = b.isActive ? 1 : 0; }
    if (b.password) {
      if (String(b.password).length < 6) return err("Password min 6 chars");
      fields.push("password_hash = :hash");
      p.hash = await hashPassword(String(b.password));
    }
    if (!fields.length) return err("Nothing to update");

    await exec(`UPDATE users SET ${fields.join(", ")} WHERE id = :id`, p);
    await audit(actor.id, "update", "user", Number(id));
    return json({ ok: true });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return guard("users.manage", async (actor) => {
    const { id } = await params;
    if (Number(id) === actor.id) return err("Cannot delete yourself", 400);
    // Don't hard-delete (FK refs on bookings) — deactivate instead
    await exec(`UPDATE users SET is_active = 0 WHERE id = :id`, { id });
    await audit(actor.id, "deactivate", "user", Number(id));
    return json({ ok: true });
  });
}
