import { NextResponse } from "next/server";
import { requirePermission, type SessionUser } from "./auth";

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

/** Generate a short booking reference like KV-7F3A9. */
export function bookingRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `KV-${s}`;
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
