import { NextRequest } from "next/server";
import { q, q1 } from "@/lib/db";
import { guard, json } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/accounting?from=&to=&villa=
export async function GET(req: NextRequest) {
  return guard("accounting.view", async () => {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from") || "2000-01-01";
    const to = sp.get("to") || "2999-12-31";
    const villa = sp.get("villa") ? Number(sp.get("villa")) : null;

    const villaPay = villa ? "AND b.villa_id = :villa" : "";
    const villaExp = villa ? "AND e.villa_id = :villa" : "";
    const p: any = { from, to, villa };

    // Revenue from payments (collected money), net of refunds, plus the B2B
    // commission slice that is passed through to partners.
    const rev = await q1<any>(
      `SELECT
         COALESCE(SUM(CASE WHEN pm.kind='payment' THEN pm.amount ELSE 0 END),0) AS collected,
         COALESCE(SUM(CASE WHEN pm.kind='refund'  THEN pm.amount ELSE 0 END),0) AS refunded,
         COALESCE(SUM(CASE WHEN pm.kind='payment' THEN pm.b2b_amount ELSE 0 END),0) AS b2b
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
          AND b.check_in BETWEEN :from AND :to ${villa ? "AND b.villa_id = :villa" : ""}`,
      p
    );

    // Per-villa breakdown — revenue net of refunds AND B2B; expenses exclude B2B.
    const perVilla = await q(
      `SELECT v.id, v.name, v.color,
              COALESCE((SELECT SUM(CASE WHEN pm.kind='payment' THEN pm.amount - pm.b2b_amount ELSE -pm.amount END)
                          FROM payments pm JOIN bookings b ON b.id = pm.booking_id
                         WHERE b.villa_id = v.id AND pm.paid_on BETWEEN :from AND :to),0) AS revenue,
              COALESCE((SELECT SUM(e.amount) FROM expenses e
                         WHERE e.villa_id = v.id AND e.spent_on BETWEEN :from AND :to
                           AND e.category <> 'B2B Commission'),0) AS expenses,
              COALESCE((SELECT SUM(pm.b2b_amount) FROM payments pm JOIN bookings b ON b.id = pm.booking_id
                         WHERE b.villa_id = v.id AND pm.kind='payment' AND pm.paid_on BETWEEN :from AND :to),0) AS b2b,
              (SELECT COUNT(*) FROM bookings b
                 WHERE b.villa_id = v.id AND b.status <> 'cancelled'
                   AND b.check_in BETWEEN :from AND :to) AS bookings
         FROM villas v ORDER BY v.id`,
      { from, to }
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
