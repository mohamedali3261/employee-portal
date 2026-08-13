require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { initDatabase } = require('./init');

const DB_PATH = path.join(__dirname, 'employees.db');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'employee_portal',
  max: 1,
});

const TABLES = ['admin_users', 'sections', 'employees', 'custom_fields', 'profile_sections', 'section_fields', 'activity_log'];

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Source SQLite DB not found:', DB_PATH);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
  const client = await pool.connect();

  try {
    await initDatabase();

    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE activity_log, employees, section_fields, custom_fields, profile_sections, sections, admin_users RESTART IDENTITY CASCADE');

    for (const table of TABLES) {
      const pragma = sqlDb.exec(`PRAGMA table_info(${table})`);
      if (pragma.length === 0) {
        console.log(`  ${table}: not present in source, skipping`);
        continue;
      }

      const cols = pragma[0].values.map((v) => v[1]);
      if (!cols.includes('id')) {
        console.log(`  ${table}: no id column, skipping`);
        continue;
      }

      const result = sqlDb.exec(`SELECT ${cols.join(',')} FROM ${table}`);
      const rows = result.length > 0 ? result[0].values : [];

      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows`);
        continue;
      }

      const placeholders = cols.map((_, i) => `$${i + 1}`).join(',');
      const insertSql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = row.map((v) => (v instanceof Uint8Array ? Buffer.from(v) : v));
        await client.query(insertSql, values);
      }

      await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`
      );

      console.log(`  ${table}: ${rows.length} rows migrated`);
    }

    await client.query('COMMIT');
    console.log('Migration committed successfully.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('Migration failed, rolled back:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    sqlDb.close();
  }
}

main();
