import { NextRequest } from "next/server";
import { q } from "@/lib/db";
import { guard, json } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&villa=
export async function GET(req: NextRequest) {
  return guard("calendar.view", async () => {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from") || new Date().toISOString().slice(0, 10);
    const to = sp.get("to") || from;
    const p: any = { from, to };
    let villaFilter = "";
    if (sp.get("villa")) { villaFilter = "AND b.villa_id = :villa"; p.villa = Number(sp.get("villa")); }

    const bookings = await q(
      `SELECT b.id, b.reference, b.villa_id AS villaId, v.name AS villaName, v.color,
              b.guest_name AS guestName, b.check_in AS checkIn, b.check_out AS checkOut,
              b.status, b.total_amount AS totalAmount
         FROM bookings b JOIN villas v ON v.id = b.villa_id
        WHERE b.status <> 'cancelled'
          AND b.check_in <= :to AND b.check_out >= :from
          ${villaFilter}
        ORDER BY b.check_in`,
      p
    );
    return json({ bookings });
  });
}
