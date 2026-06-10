import { NextRequest } from "next/server";
import { q, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return guard("expenses.view", async () => {
    const sp = req.nextUrl.searchParams;
    const where: string[] = ["1=1"];
    const p: any = {};
    if (sp.get("villa")) { where.push("e.villa_id = :villa"); p.villa = Number(sp.get("villa")); }
    if (sp.get("from")) { where.push("e.spent_on >= :from"); p.from = sp.get("from"); }
    if (sp.get("to")) { where.push("e.spent_on <= :to"); p.to = sp.get("to"); }

    const expenses = await q(
      `SELECT e.id, e.villa_id AS villaId, v.name AS villaName, e.category, e.amount,
              e.description, e.spent_on AS spentOn, e.created_at AS createdAt
         FROM expenses e LEFT JOIN villas v ON v.id = e.villa_id
        WHERE ${where.join(" AND ")}
        ORDER BY e.spent_on DESC, e.id DESC
        LIMIT 500`,
      p
    );
    return json({ expenses });
  });
}

export async function POST(req: NextRequest) {
  return guard("expenses.manage", async (user) => {
    const b = await req.json().catch(() => null);
    if (!b) return err("Invalid body");
    const amount = Number(b.amount);
    if (!(amount > 0)) return err("Amount must be positive");
    const res = await exec(
      `INSERT INTO expenses (villa_id, category, amount, description, spent_on, created_by)
       VALUES (:villaId, :category, :amount, :description, :spentOn, :uid)`,
      {
        villaId: b.villaId || null,
        category: b.category ?? "General",
        amount,
        description: b.description ?? null,
        spentOn: b.spentOn ?? new Date().toISOString().slice(0, 10),
        uid: user.id,
      }
    );
    await audit(user.id, "create", "expense", res.insertId);
    return json({ ok: true, id: res.insertId });
  });
}
