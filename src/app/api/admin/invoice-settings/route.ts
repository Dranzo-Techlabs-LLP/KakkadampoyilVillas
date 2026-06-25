import { NextRequest } from "next/server";
import { q1, exec } from "@/lib/db";
import { guard, json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  return guard("invoices.manage", async () => {
    const row = await q1<{
      prefix: string;
      next_number: number;
      padding: number;
    }>(`SELECT prefix, next_number AS next_number, padding FROM invoice_settings WHERE id = 1`);
    if (!row) return err("invoice_settings missing", 500);
    return json({
      prefix: row.prefix,
      nextNumber: row.next_number,
      padding: row.padding,
    });
  });
}

export async function PUT(req: NextRequest) {
  return guard("invoices.manage", async (user) => {
    const body = await req.json().catch(() => null);
    if (!body) return err("Invalid body");

    const prefix = typeof body.prefix === "string" ? body.prefix.trim() : "";
    const nextNumber = Number(body.nextNumber);
    const padding = Number(body.padding);

    if (prefix.length === 0 || prefix.length > 20) {
      return err("Prefix must be 1–20 characters");
    }
    if (!Number.isInteger(nextNumber) || nextNumber < 1 || nextNumber > 2_147_483_647) {
      return err("Next number must be a positive integer");
    }
    if (!Number.isInteger(padding) || padding < 0 || padding > 12) {
      return err("Padding must be 0–12");
    }

    await exec(
      `UPDATE invoice_settings
         SET prefix = :prefix, next_number = :nextNumber, padding = :padding
       WHERE id = 1`,
      { prefix, nextNumber, padding }
    );
    await audit(
      user.id,
      "update",
      "invoice_settings",
      1,
      `${prefix} #${nextNumber} pad=${padding}`
    );
    return json({ ok: true });
  });
}
