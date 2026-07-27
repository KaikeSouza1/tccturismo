import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";

async function migrate() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [file]
      );
      if (alreadyApplied.rowCount) {
        console.log(`- ${file} ja aplicada, pulando`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`> aplicando ${file}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ok`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate()
  .then(() => {
    console.log("Migrations concluidas.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Falha ao rodar migrations:", err);
    process.exit(1);
  });
