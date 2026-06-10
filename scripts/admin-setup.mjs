#!/usr/bin/env node
/**
 * Admin panel setup:
 *   1. Runs src/admin-schema.sql against the configured MySQL DB
 *   2. Creates (or resets) the first Administrator user
 *
 * Usage:
 *   DB_HOST=167.86.105.17 DB_USER=<user> DB_PASS='...' DB_NAME=villas \
 *   node scripts/admin-setup.mjs "Admin Name" admin@kakkadampoyilvillas.com 'StrongPass123'
 *
 * Or rely on .env.local being loaded by your shell / dotenv.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load .env.local if present (simple parser, no dependency)
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const [, , adminName = "Administrator", adminEmail, adminPass] = process.argv;

const cfg = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || "villas",
  multipleStatements: true,
};

if (!cfg.user || cfg.password === undefined) {
  console.error("ERROR: set DB_USER and DB_PASS (env or .env.local).");
  process.exit(1);
}

const schema = fs.readFileSync(path.join(root, "src", "admin-schema.sql"), "utf8");

const conn = await mysql.createConnection(cfg);
console.log(`Connected to ${cfg.user}@${cfg.host}/${cfg.database}`);

console.log("Applying schema…");
await conn.query(schema);
console.log("Schema applied.");

if (adminEmail && adminPass) {
  const [[role]] = await conn.query(`SELECT id FROM roles WHERE name='Administrator' LIMIT 1`);
  if (!role) throw new Error("Administrator role missing");
  const hash = await bcrypt.hash(adminPass, 10);
  const email = adminEmail.trim().toLowerCase();
  await conn.query(
    `INSERT INTO users (name, email, password_hash, role_id, is_active)
     VALUES (?,?,?,?,1)
     ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash),
       role_id=VALUES(role_id), is_active=1`,
    [adminName, email, hash, role.id]
  );
  console.log(`Admin user ready: ${email}`);
} else {
  console.log("No admin email/password supplied — skipped user creation.");
  console.log('Re-run with:  node scripts/admin-setup.mjs "Name" email@x.com "password"');
}

await conn.end();
console.log("Done.");
