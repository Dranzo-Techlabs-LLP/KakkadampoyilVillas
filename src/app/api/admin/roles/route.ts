import { NextRequest } from "next/server";
import { q, exec, pool } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// GET roles + all permissions + each role's permission keys (rights matrix)
export async function GET() {
  return guard("users.view", async () => {
    const roles = await q(
      `SELECT id, name, description, is_system AS isSystem FROM roles ORDER BY id`
    );
    const permissions = await q(
      `SELECT id, \`key\`, label, category FROM permissions ORDER BY category, id`
    );
    const rp = await q<any>(
      `SELECT rp.role_id AS roleId, p.\`key\` AS \`key\`
         FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id`
    );
    const matrix: Record<number, string[]> = {};
    for (const r of roles as any[]) matrix[r.id] = [];
    for (const row of rp) (matrix[row.roleId] ||= []).push(row.key);
    return json({ roles, permissions, matrix });
  });
}

// POST create a new role
export async function POST(req: NextRequest) {
  return guard("users.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b?.name) return err("name required");
    const res = await exec(
      `INSERT INTO roles (name, description, is_system) VALUES (:name, :desc, 0)`,
      { name: b.name, desc: b.description ?? null }
    );
    await audit(user.id, "create", "role", res.insertId, b.name);
    return json({ ok: true, id: res.insertId });
  });
}

// PATCH replace a role's permission set  { roleId, keys: [...] }
export async function PATCH(req: NextRequest) {
  return guard("users.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b?.roleId || !Array.isArray(b.keys)) return err("roleId and keys[] required");

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`DELETE FROM role_permissions WHERE role_id = :roleId`, { roleId: b.roleId });
      if (b.keys.length) {
        await conn.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT :roleId, id FROM permissions WHERE \`key\` IN (${b.keys.map(() => "?").join(",")})`,
          [b.roleId, ...b.keys]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    await audit(user.id, "update", "role", b.roleId, `${b.keys.length} perms`);
    return json({ ok: true });
  });
}
