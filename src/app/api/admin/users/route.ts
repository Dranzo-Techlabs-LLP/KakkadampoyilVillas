import { NextRequest } from "next/server";
import { q, q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  return guard("users.view", async () => {
    const users = await q(
      `SELECT u.id, u.name, u.email, u.role_id AS roleId, r.name AS roleName,
              u.is_active AS isActive, u.last_login_at AS lastLoginAt, u.created_at AS createdAt
         FROM users u JOIN roles r ON r.id = u.role_id
        ORDER BY u.id`
    );
    return json({ users });
  });
}

export async function POST(req: NextRequest) {
  return guard("users.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b?.name || !b?.email || !b?.password || !b?.roleId)
      return err("name, email, password, roleId required");
    const email = String(b.email).trim().toLowerCase();
    const exists = await q1(`SELECT id FROM users WHERE email = :email`, { email });
    if (exists) return err("Email already in use", 409);
    if (String(b.password).length < 6) return err("Password min 6 chars");

    const hash = await hashPassword(String(b.password));
    const res = await exec(
      `INSERT INTO users (name, email, password_hash, role_id, is_active)
       VALUES (:name, :email, :hash, :roleId, :active)`,
      { name: b.name, email, hash, roleId: b.roleId, active: b.isActive === false ? 0 : 1 }
    );
    await audit(user.id, "create", "user", res.insertId, email);
    return json({ ok: true, id: res.insertId });
  });
}
