import { NextResponse } from "next/server";
import { requirePermission, type SessionUser } from "./auth";
import { pool } from "./db";

export function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Guard a route handler by permission. Calls fn with the session user. */
export async function guard(
  perm: string,
  fn: (user: SessionUser) => Promise<Response> | Response
): Promise<Response> {
  const res = await requirePermission(perm);
  if (!res.ok) {
    return err(res.status === 401 ? "Unauthorized" : "Forbidden", res.status);
  }
  return fn(res.user);
}

/**
 * Allocate the next booking reference from the configured series.
 * Atomic: takes a row lock on invoice_settings, reads the next number,
 * increments and commits in one transaction so concurrent bookings get
 * distinct sequential refs.
 */
export async function bookingRef(): Promise<string> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT prefix, next_number, padding FROM invoice_settings WHERE id = 1 FOR UPDATE`
    );
    const row = (rows as Array<{ prefix: string; next_number: number; padding: number }>)[0];
    if (!row) {
      await conn.rollback();
      throw new Error("invoice_settings row missing — run scripts/migrate.mjs");
    }
    await conn.query(`UPDATE invoice_settings SET next_number = next_number + 1 WHERE id = 1`);
    await conn.commit();
    const padded = String(row.next_number).padStart(row.padding, "0");
    return `${row.prefix}${padded}`;
  } catch (e) {
    try { await conn.rollback(); } catch { /* */ }
    throw e;
  } finally {
    conn.release();
  }
}

export function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
}
