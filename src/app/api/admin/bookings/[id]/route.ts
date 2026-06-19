import { NextRequest } from "next/server";
import { q, q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return guard("bookings.view", async () => {
    const { id } = await params;
    const booking = await q1<any>(
      `SELECT b.*, v.name AS villaName, v.color,
              u.name AS createdByName
         FROM bookings b
         JOIN villas v ON v.id = b.villa_id
         LEFT JOIN users u ON u.id = b.created_by
        WHERE b.id = :id`,
      { id }
    );
    if (!booking) return err("Not found", 404);
    const payments = await q(
      `SELECT id, kind, amount, method, reference, note, paid_on AS paidOn, created_at AS createdAt
         FROM payments WHERE booking_id = :id ORDER BY paid_on, id`,
      { id }
    );
    return json({ booking, payments });
  });
}

// PATCH update / change status / cancel
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json().catch(() => null);
  if (!b) return err("Invalid body");

  // Cancellation path needs the cancel permission
  if (b.status === "cancelled") {
    return guard("bookings.cancel", async (user) => {
      await exec(
        `UPDATE bookings SET status = 'cancelled', cancel_reason = :reason WHERE id = :id`,
        { id, reason: b.cancelReason ?? null }
      );
      await audit(user.id, "cancel", "booking", Number(id), b.cancelReason ?? "");
      return json({ ok: true });
    });
  }

  return guard("bookings.manage", async (user) => {
    const fields: string[] = [];
    const p: any = { id };
    const map: Record<string, string> = {
      guestName: "guest_name", guestPhone: "guest_phone", guestPhone2: "guest_phone2",
      guestEmail: "guest_email", checkIn: "check_in", checkOut: "check_out",
      adults: "adults", children: "children", status: "status",
      totalAmount: "total_amount", source: "source", notes: "notes", villaId: "villa_id",
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in b) { fields.push(`${col} = :${k}`); p[k] = b[k]; }
    }
    if (!fields.length) return err("Nothing to update");
    await exec(`UPDATE bookings SET ${fields.join(", ")} WHERE id = :id`, p);
    await audit(user.id, "update", "booking", Number(id));
    return json({ ok: true });
  });
}
