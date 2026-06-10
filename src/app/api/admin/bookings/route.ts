import { NextRequest } from "next/server";
import { q, q1, exec } from "@/lib/db";
import { guard, json, err, bookingRef } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// GET /api/admin/bookings?villa=&status=&from=&to=&search=
export async function GET(req: NextRequest) {
  return guard("bookings.view", async () => {
    const sp = req.nextUrl.searchParams;
    const where: string[] = ["1=1"];
    const p: any = {};
    if (sp.get("villa")) { where.push("b.villa_id = :villa"); p.villa = Number(sp.get("villa")); }
    if (sp.get("status")) { where.push("b.status = :status"); p.status = sp.get("status"); }
    if (sp.get("from")) { where.push("b.check_out >= :from"); p.from = sp.get("from"); }
    if (sp.get("to")) { where.push("b.check_in <= :to"); p.to = sp.get("to"); }
    if (sp.get("search")) {
      where.push("(b.guest_name LIKE :s OR b.guest_phone LIKE :s OR b.reference LIKE :s)");
      p.s = `%${sp.get("search")}%`;
    }

    const rows = await q(
      `SELECT b.id, b.reference, b.villa_id AS villaId, v.name AS villaName, v.color,
              b.guest_name AS guestName, b.guest_phone AS guestPhone, b.guest_email AS guestEmail,
              b.check_in AS checkIn, b.check_out AS checkOut, b.adults, b.children,
              b.status, b.total_amount AS totalAmount, b.source, b.notes, b.cancel_reason AS cancelReason,
              b.created_at AS createdAt,
              COALESCE((SELECT SUM(CASE WHEN kind='payment' THEN amount ELSE -amount END)
                          FROM payments WHERE booking_id = b.id), 0) AS paid
         FROM bookings b JOIN villas v ON v.id = b.villa_id
        WHERE ${where.join(" AND ")}
        ORDER BY b.check_in DESC
        LIMIT 500`,
      p
    );
    return json({ bookings: rows });
  });
}

// POST create booking
export async function POST(req: NextRequest) {
  return guard("bookings.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");
    const required = ["villaId", "guestName", "checkIn", "checkOut"];
    for (const k of required) if (!b[k]) return err(`${k} required`);
    if (b.checkOut <= b.checkIn) return err("Check-out must be after check-in");

    // Overlap check against active (non-cancelled) bookings
    const clash = await q1<any>(
      `SELECT id, reference FROM bookings
        WHERE villa_id = :villaId AND status <> 'cancelled'
          AND check_in < :checkOut AND check_out > :checkIn
        LIMIT 1`,
      { villaId: b.villaId, checkIn: b.checkIn, checkOut: b.checkOut }
    );
    if (clash && !b.allowOverlap) {
      return err(`Dates overlap booking ${clash.reference}`, 409);
    }

    const ref = bookingRef();
    const res = await exec(
      `INSERT INTO bookings
        (reference, villa_id, guest_name, guest_phone, guest_email, check_in, check_out,
         adults, children, status, total_amount, source, notes, created_by)
       VALUES
        (:ref, :villaId, :guestName, :guestPhone, :guestEmail, :checkIn, :checkOut,
         :adults, :children, :status, :totalAmount, :source, :notes, :uid)`,
      {
        ref,
        villaId: b.villaId,
        guestName: b.guestName,
        guestPhone: b.guestPhone ?? null,
        guestEmail: b.guestEmail ?? null,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        adults: b.adults ?? 1,
        children: b.children ?? 0,
        status: b.status ?? "confirmed",
        totalAmount: b.totalAmount ?? 0,
        source: b.source ?? "direct",
        notes: b.notes ?? null,
        uid: user.id,
      }
    );
    await audit(user.id, "create", "booking", res.insertId, ref);
    return json({ ok: true, id: res.insertId, reference: ref });
  });
}
