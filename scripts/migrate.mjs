// Idempotent schema migration for the new feature batch:
//   1) bookings.status: extend ENUM to include 'hold'
//   2) invoice_settings: single-row config for the booking-ref series
//   3) permissions: add invoices.manage + grant to Administrator
//
// Safe to re-run. Reads .env.local for DB creds.

import { readFileSync } from "node:fs";
import mysql from "mysql2/promise";

const envText = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  process.env[m[1]] ??= v;
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectTimeout: 30000,
  multipleStatements: false,
});

async function step(label, fn) {
  process.stdout.write(`• ${label}… `);
  try {
    await fn();
    console.log("ok");
  } catch (e) {
    console.log("FAIL");
    throw e;
  }
}

// 1) Add 'hold' to bookings.status enum (idempotent — MODIFY just sets the column definition).
await step("extend bookings.status enum with 'hold'", async () => {
  await conn.query(
    `ALTER TABLE bookings MODIFY status
       ENUM('enquiry','hold','confirmed','checked_in','completed','cancelled')
       NOT NULL DEFAULT 'enquiry'`
  );
});

// 2) invoice_settings: single-row table holding ref series config.
await step("create invoice_settings table", async () => {
  await conn.query(
    `CREATE TABLE IF NOT EXISTS invoice_settings (
       id          TINYINT NOT NULL DEFAULT 1 PRIMARY KEY,
       prefix      VARCHAR(20) NOT NULL DEFAULT 'KV-',
       next_number INT NOT NULL DEFAULT 1,
       padding     TINYINT NOT NULL DEFAULT 5,
       updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       CHECK (id = 1)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  );
});

// Seed default row if missing. Start next_number above the highest legacy
// random-ref booking is unnecessary because old refs use letters; numeric
// collision is impossible.
await step("seed invoice_settings default row", async () => {
  await conn.query(
    `INSERT IGNORE INTO invoice_settings (id, prefix, next_number, padding)
     VALUES (1, 'KV-', 1, 5)`
  );
});

// 2b) Editable terms & conditions printed on page 2 of every invoice.
//     MySQL 8 has no ADD COLUMN IF NOT EXISTS, so guard via information_schema.
await step("add invoice_settings.terms column", async () => {
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'invoice_settings'
        AND COLUMN_NAME = 'terms'`
  );
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE invoice_settings ADD COLUMN terms TEXT NULL AFTER padding`);
  }
});

// 3) New permission for the Invoice settings page.
await step("add invoices.manage permission", async () => {
  await conn.query(
    `INSERT IGNORE INTO permissions (\`key\`, label, category)
     VALUES ('invoices.manage', 'Edit invoice number series', 'Administration')`
  );
});

await step("grant invoices.manage to Administrator", async () => {
  await conn.query(
    `INSERT IGNORE INTO role_permissions (role_id, permission_id)
     SELECT r.id, p.id FROM roles r JOIN permissions p ON p.\`key\` = 'invoices.manage'
     WHERE r.name = 'Administrator'`
  );
});

await conn.end();
console.log("\nMigration complete.");
