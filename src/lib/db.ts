import mysql from "mysql2/promise";

// Single shared pool. Reused across hot-reloads in dev via globalThis.
declare global {
  // eslint-disable-next-line no-var
  var __villasPool: mysql.Pool | undefined;
}

function createPool() {
  return mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "villas",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "villas",
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
    namedPlaceholders: true,
    timezone: "+00:00",
    dateStrings: true,
    connectTimeout: 30000,
  });
}

export const pool: mysql.Pool = global.__villasPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.__villasPool = pool;

// Convenience helpers
export async function q<T = any>(sql: string, params?: any): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function q1<T = any>(sql: string, params?: any): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows.length ? rows[0] : null;
}

export async function exec(sql: string, params?: any) {
  const [res] = await pool.query(sql, params);
  return res as mysql.ResultSetHeader;
}
