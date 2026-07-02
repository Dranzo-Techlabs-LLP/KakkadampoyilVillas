import { NextRequest } from "next/server";
import { q, q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return guard("payments.view", async () => {
    const { id } = await params;
    const payments = await q(
      `SELECT id, kind, amount, b2b_amount AS b2bAmount, method, reference, note, paid_on AS paidOn
         FROM payments WHERE booking_id = :id ORDER BY paid_on, id`,
      { id }
    );
    return json({ payments });
  });
}

// POST record payment or refund. Payments may carry a B2B commission slice
// which is booked as a linked expense (category "B2B Commission").
export async function POST(req: NextRequest, { params }: Ctx) {
  return guard("payments.manage", async (user) => {
    const { id } = await params;
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");
    const kind = b.kind === "refund" ? "refund" : "payment";
    const amount = Number(b.amount);
    if (!(amount > 0)) return err("Amount must be positive");

    // B2B commission only applies to inbound payments, never refunds.
    const b2b = kind === "payment" ? Math.max(0, Number(b.b2bAmount) || 0) : 0;
    if (b2b > amount) return err("B2B amount cannot exceed the received amount");

    const res = await exec(
      `INSERT INTO payments (booking_id, kind, amount, b2b_amount, method, reference, note, paid_on, created_by)
       VALUES (:bid, :kind, :amount, :b2b, :method, :reference, :note, :paidOn, :uid)`,
      {
        bid: id,
        kind,
        amount,
        b2b,
        method: b.method ?? "cash",
        reference: b.reference ?? null,
        note: b.note ?? null,
        paidOn: b.paidOn ?? new Date().toISOString().slice(0, 10),
        uid: user.id,
      }
    );

    // Book the B2B slice as an expense linked to this booking so it shows in the
    // expense ledger and is payable to the partner. Excluded from operating
    // expenses in the accounting summary to avoid double-counting.
    if (b2b > 0) {
      const bk = await q1<any>(
        `SELECT villa_id AS villaId, reference FROM bookings WHERE id = :id`,
        { id }
      );
      await exec(
        `INSERT INTO expenses (villa_id, booking_id, category, amount, description, spent_on, created_by)
         VALUES (:villaId, :bid, 'B2B Commission', :amount, :desc, :spentOn, :uid)`,
        {
          villaId: bk?.villaId ?? null,
          bid: id,
          amount: b2b,
          desc: `B2B commission · ${bk?.reference ?? id}`,
          spentOn: b.paidOn ?? new Date().toISOString().slice(0, 10),
          uid: user.id,
        }
      );
    }

    await audit(user.id, kind, "payment", res.insertId, `booking ${id}${b2b ? ` · B2B ${b2b}` : ""}`);
    return json({ ok: true, id: res.insertId });
  });
}
