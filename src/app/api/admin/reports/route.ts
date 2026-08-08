import { NextRequest } from "next/server";
import { q } from "@/lib/db";
import { guard, err, toCsv } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/reports?type=bookings|payments|expenses|combined&from=&to=&villa=&format=csv
export async function GET(req: NextRequest) {
  return guard("reports.view", async () => {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") || "bookings";
    const from = sp.get("from") || "2000-01-01";
    const to = sp.get("to") || "2999-12-31";
    const villa = sp.get("villa") ? Number(sp.get("villa")) : null;
    const format = sp.get("format") || "json";
    // basis=stay → group by the booking's stay month (check_in).
    // basis=cash → group by the actual transaction date (paid_on / spent_on),
    //              so an advance paid in another month is excluded.
    const basis = sp.get("basis") === "cash" ? "cash" : "stay";

    let rows: any[] = [];
    let totals:
      | { credited: number; debited: number; overall: number; entries: number;
          cashIn?: number; cashOut?: number; balance?: number }
      | undefined;
    if (type === "bookings") {
      rows = await q(
        `SELECT b.reference AS Reference, v.name AS Villa, b.guest_name AS Guest,
                b.guest_phone AS Phone, b.check_in AS CheckIn, b.check_out AS CheckOut,
                (b.adults + b.children) AS Guests, b.status AS Status,
                b.total_amount AS Total,
                COALESCE((SELECT SUM(CASE WHEN kind='payment' THEN amount ELSE -amount END)
                            FROM payments WHERE booking_id=b.id),0) AS Paid,
                b.source AS Source
           FROM bookings b JOIN villas v ON v.id = b.villa_id
          WHERE b.check_in BETWEEN :from AND :to ${villa ? "AND b.villa_id=:villa" : ""}
          ORDER BY b.check_in DESC`,
        { from, to, villa }
      );
    } else if (type === "payments") {
      // stay basis → filter by the stay month; cash basis → by the payment date.
      const dateFilter = basis === "cash" ? "pm.paid_on" : "b.check_in";
      rows = await q(
        `SELECT pm.paid_on AS Date, b.check_in AS Stay,
                b.reference AS Booking, v.name AS Villa, b.source AS Source,
                pm.kind AS Kind, pm.amount AS Amount, pm.method AS Method, pm.reference AS Ref
           FROM payments pm JOIN bookings b ON b.id = pm.booking_id JOIN villas v ON v.id = b.villa_id
          WHERE ${dateFilter} BETWEEN :from AND :to ${villa ? "AND b.villa_id=:villa" : ""}
          ORDER BY ${dateFilter} DESC, pm.paid_on DESC`,
        { from, to, villa }
      );
    } else if (type === "expenses") {
      // stay basis → booking-linked expenses sit in the stay's month;
      // cash basis → every expense on its own spent_on date.
      const dateFilter = basis === "cash" ? "e.spent_on" : "COALESCE(b.check_in, e.spent_on)";
      rows = await q(
        `SELECT e.spent_on AS Date,
                COALESCE(b.check_in, e.spent_on) AS Stay,
                COALESCE(v.name,'(general)') AS Villa,
                e.category AS Category, e.amount AS Amount, e.description AS Description,
                b.reference AS Booking, COALESCE(b.source,'') AS Source
           FROM expenses e
           LEFT JOIN villas v ON v.id = e.villa_id
           LEFT JOIN bookings b ON b.id = e.booking_id
          WHERE ${dateFilter} BETWEEN :from AND :to
                ${villa ? "AND e.villa_id=:villa" : ""}
          ORDER BY ${dateFilter} DESC, e.spent_on DESC`,
        { from, to, villa }
      );
    } else if (type === "combined") {
      // Cash book style: payments = cash in, refunds + expenses = cash out.
      // Report period is based on the stay date (booking.check_in) for anything
      // linked to a booking, and the transaction date for standalone entries.
      // This means an August advance for a September stay appears in September.
      const villaClauseP = villa ? "AND b.villa_id = :villa" : "";
      const villaClauseE = villa ? "AND e.villa_id = :villa" : "";
      // Date filter column per basis.
      const payFilter = basis === "cash" ? "pm.paid_on" : "b.check_in";
      const expFilter = basis === "cash" ? "e.spent_on" : "COALESCE(bx.check_in, e.spent_on)";
      // Cash basis reads chronologically by transaction date; stay basis by stay.
      const orderBy = basis === "cash" ? "d ASC, sort_id ASC" : "stay ASC, sort_id ASC";
      const raw = await q<any>(
        `SELECT * FROM (
           SELECT pm.paid_on AS d,
                  b.check_in AS stay,
                  v.name AS villa,
                  COALESCE(b.source, '') AS src,
                  COALESCE(NULLIF(pm.note, ''), CONCAT('Booking · ', b.reference)) AS remark,
                  COALESCE(u.name, '—') AS entry_by,
                  pm.method AS mode,
                  pm.amount AS cash_in,
                  0 AS cash_out,
                  pm.id AS sort_id
             FROM payments pm
             JOIN bookings b ON b.id = pm.booking_id
             JOIN villas v ON v.id = b.villa_id
             LEFT JOIN users u ON u.id = pm.created_by
            WHERE pm.kind = 'payment'
              AND ${payFilter} BETWEEN :from AND :to
              ${villaClauseP}
           UNION ALL
           SELECT pm.paid_on AS d,
                  b.check_in AS stay,
                  v.name AS villa,
                  COALESCE(b.source, '') AS src,
                  CONCAT('Refund · ', b.reference) AS remark,
                  COALESCE(u.name, '—') AS entry_by,
                  pm.method AS mode,
                  0 AS cash_in,
                  pm.amount AS cash_out,
                  pm.id AS sort_id
             FROM payments pm
             JOIN bookings b ON b.id = pm.booking_id
             JOIN villas v ON v.id = b.villa_id
             LEFT JOIN users u ON u.id = pm.created_by
            WHERE pm.kind = 'refund'
              AND ${payFilter} BETWEEN :from AND :to
              ${villaClauseP}
           UNION ALL
           SELECT e.spent_on AS d,
                  COALESCE(bx.check_in, e.spent_on) AS stay,
                  COALESCE(v.name, '(general)') AS villa,
                  COALESCE(bx.source, '') AS src,
                  COALESCE(NULLIF(e.description, ''), e.category) AS remark,
                  COALESCE(u.name, '—') AS entry_by,
                  'cash' AS mode,
                  0 AS cash_in,
                  e.amount AS cash_out,
                  e.id AS sort_id
             FROM expenses e
             LEFT JOIN villas v ON v.id = e.villa_id
             LEFT JOIN bookings bx ON bx.id = e.booking_id
             LEFT JOIN users u ON u.id = e.created_by
            WHERE ${expFilter} BETWEEN :from AND :to
              ${villaClauseE}
         ) x
         ORDER BY ${orderBy}`,
        { from, to, villa }
      );

      let balance = 0;
      let cashInTotal = 0;
      let cashOutTotal = 0;
      rows = raw.map((r) => {
        const cin = Number(r.cash_in) || 0;
        const cout = Number(r.cash_out) || 0;
        balance += cin - cout;
        cashInTotal += cin;
        cashOutTotal += cout;
        return {
          Date: r.d,
          Stay: r.stay,
          Villa: r.villa,
          Source: r.src || "",
          Remark: r.remark,
          "Entry by": r.entry_by,
          Mode: r.mode,
          "Cash in": cin,
          "Cash out": cout,
          Balance: balance,
        };
      });
      totals = {
        credited: cashInTotal,
        debited: cashOutTotal,
        overall: cashInTotal - cashOutTotal,
        entries: rows.length,
        // kept for the combined print view
        cashIn: cashInTotal,
        cashOut: cashOutTotal,
        balance: cashInTotal - cashOutTotal,
      };
    } else {
      return err("Unknown report type");
    }

    // Unified credited / debited / overall totals for the non-combined reports.
    if (type !== "combined") {
      const sum = (pred: (r: any) => number) => rows.reduce((s, r) => s + (pred(r) || 0), 0);
      let credited = 0;
      let debited = 0;
      if (type === "payments") {
        credited = sum((r) => (r.Kind === "payment" ? Number(r.Amount) : 0));
        debited = sum((r) => (r.Kind === "refund" ? Number(r.Amount) : 0));
      } else if (type === "expenses") {
        debited = sum((r) => Number(r.Amount));
      } else if (type === "bookings") {
        credited = sum((r) => Number(r.Paid)); // net received across bookings
      }
      totals = { credited, debited, overall: credited - debited, entries: rows.length };
    }

    if (format === "csv") {
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}-${from}_to_${to}.csv"`,
        },
      });
    }
    return Response.json({ rows, totals });
  });
}
