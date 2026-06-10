import { NextRequest } from "next/server";
import { q1, exec } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { json, err } from "@/lib/api";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err("Invalid body");
  }
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) return err("Email and password required");

  const user = await q1<any>(
    `SELECT id, name, password_hash AS hash, is_active AS isActive
       FROM users WHERE email = :email`,
    { email }
  );
  if (!user || !user.isActive) return err("Invalid credentials", 401);

  const ok = await verifyPassword(password, user.hash);
  if (!ok) return err("Invalid credentials", 401);

  await createSession(user.id);
  await exec(`UPDATE users SET last_login_at = NOW() WHERE id = :id`, { id: user.id });
  await audit(user.id, "login", "user", user.id);

  return json({ ok: true });
}
