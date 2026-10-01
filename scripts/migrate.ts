import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

// Applies every migrations/*.sql file that hasn't run yet, in filename order.
// Each file runs inside its own transaction and is recorded in schema_migrations.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url });
  const dir = path.join(process.cwd(), "migrations");

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);

    const { rows } = await pool.query<{ name: string }>(
      "SELECT name FROM schema_migrations",
    );
    const applied = new Set(rows.map((r) => r.name));

    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    let ran = 0;

    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`applied ${file}`);
        ran++;
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`migration ${file} failed: ${(err as Error).message}`);
      } finally {
        client.release();
      }
    }

    console.log(ran === 0 ? "database is up to date" : `applied ${ran} migration(s)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
