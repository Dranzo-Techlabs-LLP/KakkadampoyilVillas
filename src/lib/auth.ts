import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { q, q1 } from "./db";

export const SESSION_COOKIE = "kv_admin";
const ALG = "HS256";

function secret() {
  const s = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(s);
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  permissions: string[];
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Verify the JWT only (edge-safe, no DB). Returns user id or null. */
export async function verifyToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return typeof payload.uid === "number" ? payload.uid : null;
  } catch {
    return null;
  }
}

/** Load the full session user (DB) from the cookie. Node runtime only. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = await verifyToken(token);
  if (!uid) return null;

  const row = await q1<any>(
    `SELECT u.id, u.name, u.email, u.role_id AS roleId, u.is_active AS isActive,
            r.name AS roleName
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = :uid`,
    { uid }
  );
  if (!row || !row.isActive) return null;

  const perms = await q<{ key: string }>(
    `SELECT p.\`key\` AS \`key\`
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
      WHERE rp.role_id = :roleId`,
    { roleId: row.roleId }
  );

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roleId: row.roleId,
    roleName: row.roleName,
    permissions: perms.map((p) => p.key),
  };
}

export function can(user: SessionUser | null, perm: string) {
  return !!user && user.permissions.includes(perm);
}

/** Throw-style guard for API routes. Returns user or null (caller 401/403s). */
export async function requirePermission(perm: string): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; status: number }
> {
  const user = await getSessionUser();
  if (!user) return { ok: false, status: 401 };
  if (!user.permissions.includes(perm)) return { ok: false, status: 403 };
  return { ok: true, user };
}
