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
      terms: string | null;
    }>(`SELECT prefix, next_number AS next_number, padding, terms FROM invoice_settings WHERE id = 1`);
    if (!row) return err("invoice_settings missing", 500);
    return json({
      prefix: row.prefix,
      nextNumber: row.next_number,
      padding: row.padding,
      terms: row.terms ?? "",
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
    // Terms are optional free text. Normalise CRLF and cap length so a huge
    // paste can't blow past the TEXT column limit.
    const terms = typeof body.terms === "string"
      ? body.terms.replace(/\r\n/g, "\n").trimEnd()
      : "";

    if (prefix.length === 0 || prefix.length > 20) {
      return err("Prefix must be 1–20 characters");
    }
    if (!Number.isInteger(nextNumber) || nextNumber < 1 || nextNumber > 2_147_483_647) {
      return err("Next number must be a positive integer");
    }
    if (!Number.isInteger(padding) || padding < 0 || padding > 12) {
      return err("Padding must be 0–12");
    }
    if (terms.length > 20000) {
      return err("Terms & conditions must be under 20,000 characters");
    }

    await exec(
      `UPDATE invoice_settings
         SET prefix = :prefix, next_number = :nextNumber, padding = :padding, terms = :terms
       WHERE id = 1`,
      { prefix, nextNumber, padding, terms: terms || null }
    );
    await audit(
      user.id,
      "update",
      "invoice_settings",
      1,
      `${prefix} #${nextNumber} pad=${padding} terms=${terms.length}c`
    );
    return json({ ok: true });
  });
}
