import fs from "node:fs";
import path from "node:path";
import { pool } from "../config/db";
import type { PoolClient } from "pg";

/**
 * A tabela de controle de migrations foi ela propria renomeada (de
 * schema_migrations/name/applied_at para migracoes_esquema/nome/aplicado_em)
 * pela migration 006. Resolve o nome atual via to_regclass em vez de
 * hardcoded, porque a migration 006 faz esse rename no meio da mesma
 * transacao em que o runner registra a propria aplicacao dela — nesse
 * instante o nome "atual" muda de uma chamada para a proxima.
 */
async function trackingTable(client: PoolClient): Promise<{ table: string; name: string; appliedAt: string }> {
  const result = await client.query<{ exists: boolean }>(
    "SELECT to_regclass('public.migracoes_esquema') IS NOT NULL AS exists"
  );
  return result.rows[0].exists
    ? { table: "migracoes_esquema", name: "nome", appliedAt: "aplicado_em" }
    : { table: "schema_migrations", name: "name", appliedAt: "applied_at" };
}

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
      const before = await trackingTable(client);
      const alreadyApplied = await client.query(
        `SELECT 1 FROM ${before.table} WHERE ${before.name} = $1`,
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
        const after = await trackingTable(client);
        await client.query(`INSERT INTO ${after.table} (${after.name}) VALUES ($1)`, [file]);
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
