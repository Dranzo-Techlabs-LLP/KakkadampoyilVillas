import { NextRequest } from "next/server";
import { q, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return guard("payments.view", async () => {
    const { id } = await params;
    const payments = await q(
      `SELECT id, kind, amount, method, reference, note, paid_on AS paidOn
         FROM payments WHERE booking_id = :id ORDER BY paid_on, id`,
      { id }
    );
    return json({ payments });
  });
}

// POST record payment or refund
export async function POST(req: NextRequest, { params }: Ctx) {
  return guard("payments.manage", async (user) => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");
    const kind = b.kind === "refund" ? "refund" : "payment";
    const amount = Number(b.amount);
    if (!(amount > 0)) return err("Amount must be positive");

    const res = await exec(
      `INSERT INTO payments (booking_id, kind, amount, method, reference, note, paid_on, created_by)
       VALUES (:bid, :kind, :amount, :method, :reference, :note, :paidOn, :uid)`,
      {
        bid: id,
        kind,
        amount,
        method: b.method ?? "cash",
        reference: b.reference ?? null,
        note: b.note ?? null,
        paidOn: b.paidOn ?? new Date().toISOString().slice(0, 10),
        uid: user.id,
      }
    );
    await audit(user.id, kind, "payment", res.insertId, `booking ${id}`);
    return json({ ok: true, id: res.insertId });
  });
}
