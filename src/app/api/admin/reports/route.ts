import { NextRequest } from "next/server";
import { q } from "@/lib/db";
import { guard, err, toCsv } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/admin/reports?type=bookings|payments|expenses&from=&to=&villa=&format=csv
export async function GET(req: NextRequest) {
  return guard("reports.view", async () => {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") || "bookings";
    const from = sp.get("from") || "2000-01-01";
    const to = sp.get("to") || "2999-12-31";
    const villa = sp.get("villa") ? Number(sp.get("villa")) : null;
    const format = sp.get("format") || "json";

    let rows: any[] = [];
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
      rows = await q(
        `SELECT pm.paid_on AS Date, b.reference AS Booking, v.name AS Villa,
                pm.kind AS Kind, pm.amount AS Amount, pm.method AS Method, pm.reference AS Ref
           FROM payments pm JOIN bookings b ON b.id = pm.booking_id JOIN villas v ON v.id = b.villa_id
          WHERE pm.paid_on BETWEEN :from AND :to ${villa ? "AND b.villa_id=:villa" : ""}
          ORDER BY pm.paid_on DESC`,
        { from, to, villa }
      );
    } else if (type === "expenses") {
      rows = await q(
        `SELECT e.spent_on AS Date, COALESCE(v.name,'(general)') AS Villa,
                e.category AS Category, e.amount AS Amount, e.description AS Description
           FROM expenses e LEFT JOIN villas v ON v.id = e.villa_id
          WHERE e.spent_on BETWEEN :from AND :to ${villa ? "AND e.villa_id=:villa" : ""}
          ORDER BY e.spent_on DESC`,
        { from, to, villa }
      );
    } else {
      return err("Unknown report type");
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
    return Response.json({ rows });
  });
}
