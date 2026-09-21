import { NextRequest } from "next/server";
import { q, q1 } from "@/lib/db";
import { guard, json } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/accounting?from=&to=&villa=
export async function GET(req: NextRequest) {
  return guard("accounting.view", async (user) => {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from") || "2000-01-01";
    const to = sp.get("to") || "2999-12-31";
    const requestedVilla = sp.get("villa") ? Number(sp.get("villa")) : null;
    // Owner scoping: villaIds is a hard boundary. A requested villa inside the
    // boundary narrows to that one; otherwise the owner sees all their villas.
    const scopedVillas: number[] = user.villaIds && user.villaIds.length
      ? (requestedVilla && user.villaIds.includes(requestedVilla)
          ? [requestedVilla]
          : user.villaIds)
      : (requestedVilla ? [requestedVilla] : []);
    const villaParams: Record<string, number> = {};
    scopedVillas.forEach((id, i) => { villaParams[`vs${i}`] = id; });
    const villaIn = scopedVillas.length
      ? "IN (" + scopedVillas.map((_, i) => `:vs${i}`).join(",") + ")"
      : "";
    const perVillaIn = user.villaIds && user.villaIds.length
      ? "WHERE v.id IN (" + user.villaIds.map((_, i) => `:pvs${i}`).join(",") + ")"
      : "";
    const perVillaParams: Record<string, number> = {};
    if (user.villaIds) user.villaIds.forEach((id, i) => { perVillaParams[`pvs${i}`] = id; });

    const villaPay = villaIn ? `AND b.villa_id ${villaIn}` : "";
    const villaExp = villaIn ? `AND e.villa_id ${villaIn}` : "";
    const p: any = { from, to, ...villaParams };

    // Revenue from payments (collected money), net of refunds, plus the B2B
    // commission slice that is passed through to partners. B2B is only owed
    // when the stay happens — for cancelled bookings we treat b2b as 0.
    const rev = await q1<any>(
      `SELECT
         COALESCE(SUM(CASE WHEN pm.kind='payment' THEN pm.amount ELSE 0 END),0) AS collected,
         COALESCE(SUM(CASE WHEN pm.kind='refund'  THEN pm.amount ELSE 0 END),0) AS refunded,
         COALESCE(SUM(CASE WHEN pm.kind='payment' AND b.status <> 'cancelled'
                           THEN pm.b2b_amount ELSE 0 END),0) AS b2b
       FROM payments pm JOIN bookings b ON b.id = pm.booking_id
       WHERE pm.paid_on BETWEEN :from AND :to ${villaPay}`,
      p
    );

    // Operating expenses exclude auto-booked B2B commission (already removed
    // from revenue) to avoid double counting.
    const exp = await q1<any>(
      `SELECT COALESCE(SUM(e.amount),0) AS total
         FROM expenses e
        WHERE e.spent_on BETWEEN :from AND :to AND e.category <> 'B2B Commission' ${villaExp}`,
      p
    );

    // Contracted (sum of total_amount of confirmed/completed bookings in window)
    const contracted = await q1<any>(
      `SELECT COALESCE(SUM(b.total_amount),0) AS total, COUNT(*) AS count
         FROM bookings b
        WHERE b.status IN ('confirmed','checked_in','completed')
          AND b.check_in BETWEEN :from AND :to ${villaPay}`,
      p
    );

    // Per-villa breakdown — revenue net of refunds AND B2B; expenses exclude B2B.
    // For owners, restrict the villa list to their own villas.
    const perVilla = await q(
      `SELECT v.id, v.name, v.color,
              COALESCE((SELECT SUM(
                          CASE WHEN pm.kind='payment' THEN
                                 pm.amount - (CASE WHEN b.status='cancelled' THEN 0 ELSE pm.b2b_amount END)
                               ELSE -pm.amount END)
                          FROM payments pm JOIN bookings b ON b.id = pm.booking_id
                         WHERE b.villa_id = v.id AND pm.paid_on BETWEEN :from AND :to),0) AS revenue,
              COALESCE((SELECT SUM(e.amount) FROM expenses e
                         WHERE e.villa_id = v.id AND e.spent_on BETWEEN :from AND :to
                           AND e.category <> 'B2B Commission'),0) AS expenses,
              COALESCE((SELECT SUM(pm.b2b_amount) FROM payments pm JOIN bookings b ON b.id = pm.booking_id
                         WHERE b.villa_id = v.id AND pm.kind='payment'
                           AND b.status <> 'cancelled'
                           AND pm.paid_on BETWEEN :from AND :to),0) AS b2b,
              (SELECT COUNT(*) FROM bookings b
                 WHERE b.villa_id = v.id AND b.status <> 'cancelled'
                   AND b.check_in BETWEEN :from AND :to) AS bookings
         FROM villas v ${perVillaIn} ORDER BY v.id`,
      { from, to, ...perVillaParams }
    );

    const collected = Number(rev?.collected || 0);
    const refunded = Number(rev?.refunded || 0);
    const b2b = Number(rev?.b2b || 0);
    const expenses = Number(exp?.total || 0);
    // Revenue excludes the B2B pass-through and refunds.
    const netRevenue = collected - refunded - b2b;

    return json({
      summary: {
        collected,        // gross received from guests
        refunded,
        b2b,              // partner commission (also in expense ledger)
        netRevenue,       // collected − refunds − B2B
        expenses,         // operating expenses (excludes B2B)
        profit: netRevenue - expenses,
        contracted: Number(contracted?.total || 0),
        bookingCount: Number(contracted?.count || 0),
      },
      perVilla,
    });
  });
}
