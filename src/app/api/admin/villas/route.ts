import { NextRequest } from "next/server";
import { q, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  return guard("villas.view", async () => {
    const villas = await q(
      `SELECT id, slug, name, capacity, bedrooms, base_rate AS baseRate,
              color, is_active AS isActive
         FROM villas ORDER BY id`
    );
    return json({ villas });
  });
}

export async function PATCH(req: NextRequest) {
  return guard("villas.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b?.id) return err("id required");
    await exec(
      `UPDATE villas SET name = :name, capacity = :capacity, bedrooms = :bedrooms,
              base_rate = :baseRate, color = :color, is_active = :isActive
        WHERE id = :id`,
      {
        id: b.id,
        name: b.name,
        capacity: b.capacity ?? 0,
        bedrooms: b.bedrooms ?? 0,
        baseRate: b.baseRate ?? 0,
        color: b.color ?? "#1F4D2B",
        isActive: b.isActive ? 1 : 0,
      }
    );
    await audit(user.id, "update", "villa", b.id);
    return json({ ok: true });
  });
}
