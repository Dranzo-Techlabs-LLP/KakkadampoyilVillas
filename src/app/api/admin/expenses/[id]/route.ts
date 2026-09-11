import { NextRequest } from "next/server";
import { q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return guard("expenses.manage", async (user) => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");

    const map: Record<string, string> = {
      villaId: "villa_id",
      bookingId: "booking_id",
      category: "category",
      amount: "amount",
      description: "description",
      spentOn: "spent_on",
    };
    const fields: string[] = [];
    const p: any = { id };
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { fields.push(`${col} = :${k}`); p[k] = b[k]; }
    }
    if (!fields.length) return err("Nothing to update");

    if ("amount" in b) {
      const n = Number(b.amount);
      if (!(n > 0)) return err("Amount must be positive");
      p.amount = n;
    }
    // If a booking is linked but no villa given, inherit the booking's villa.
    if (p.bookingId && !p.villaId) {
      const bk = await q1<any>(`SELECT villa_id AS villaId FROM bookings WHERE id = :id`, { id: p.bookingId });
      if (bk?.villaId) p.villaId = bk.villaId;
      if (!fields.includes("villa_id = :villaId")) fields.push("villa_id = :villaId");
    }

    await exec(`UPDATE expenses SET ${fields.join(", ")} WHERE id = :id`, p);
    await audit(user.id, "update", "expense", Number(id));
    return json({ ok: true });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return guard("expenses.manage", async (user) => {
    const { id } = await params;
    await exec(`DELETE FROM expenses WHERE id = :id`, { id });
    await audit(user.id, "delete", "expense", Number(id));
    return json({ ok: true });
  });
}
