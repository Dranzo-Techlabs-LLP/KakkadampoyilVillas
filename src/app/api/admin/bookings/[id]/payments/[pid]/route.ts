import { NextRequest } from "next/server";
import { q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string; pid: string }> };

// The linked B2B commission expense is stored as a plain row in `expenses`
// with category='B2B Commission' + the same booking_id + amount + spent_on as
// the payment's b2b slice. We match by that quadruple so edits/deletes of a
// payment keep the expense ledger in sync without needing a new FK column.
async function deleteLinkedB2BExpense(bookingId: number, amount: number, spentOn: string) {
  await exec(
    `DELETE FROM expenses
      WHERE booking_id = :bid
        AND category = 'B2B Commission'
        AND amount = :amount
        AND spent_on = :spentOn
      ORDER BY created_at ASC
      LIMIT 1`,
    { bid: bookingId, amount, spentOn }
  );
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return guard("payments.manage", async (user) => {
    const { id, pid } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return err("Invalid body");

    const existing = await q1<any>(
      `SELECT id, booking_id AS bookingId, kind, amount, b2b_amount AS b2bAmount,
              method, reference, note, paid_on AS paidOn
         FROM payments WHERE id = :pid AND booking_id = :bid`,
      { pid, bid: id }
    );
    if (!existing) return err("Payment not found", 404);

    const kind = body.kind === "refund" ? "refund" : "payment";
    const amount = Number(body.amount);
    if (!(amount > 0)) return err("Amount must be positive");
    const b2b = kind === "payment" ? Math.max(0, Number(body.b2bAmount) || 0) : 0;
    if (b2b > amount) return err("B2B amount cannot exceed the received amount");

    const paidOn = body.paidOn ?? existing.paidOn;

    await exec(
      `UPDATE payments
          SET kind = :kind, amount = :amount, b2b_amount = :b2b,
              method = :method, reference = :reference, note = :note, paid_on = :paidOn
        WHERE id = :pid AND booking_id = :bid`,
      {
        kind, amount, b2b,
        method: body.method ?? existing.method ?? "cash",
        reference: body.reference ?? null,
        note: body.note ?? null,
        paidOn,
        pid, bid: id,
      }
    );

    // Sync linked B2B commission expense: remove the old row (if any), then
    // insert a new one for the new slice (if any). Simple, avoids drift.
    const oldB2B = Number(existing.b2bAmount) || 0;
    if (oldB2B > 0) {
      await deleteLinkedB2BExpense(Number(id), oldB2B, String(existing.paidOn).slice(0, 10));
    }
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
          spentOn: paidOn,
          uid: user.id,
        }
      );
    }

    await audit(user.id, "update", "payment", Number(pid), `booking ${id}`);
    return json({ ok: true });
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return guard("payments.manage", async (user) => {
    const { id, pid } = await params;

    const existing = await q1<any>(
      `SELECT id, b2b_amount AS b2bAmount, paid_on AS paidOn
         FROM payments WHERE id = :pid AND booking_id = :bid`,
      { pid, bid: id }
    );
    if (!existing) return err("Payment not found", 404);

    const b2b = Number(existing.b2bAmount) || 0;
    if (b2b > 0) {
      await deleteLinkedB2BExpense(Number(id), b2b, String(existing.paidOn).slice(0, 10));
    }
    await exec(`DELETE FROM payments WHERE id = :pid AND booking_id = :bid`, { pid, bid: id });

    await audit(user.id, "delete", "payment", Number(pid), `booking ${id}`);
    return json({ ok: true });
  });
}
