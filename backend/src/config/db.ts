import { Pool, type QueryResultRow } from "pg";
import { env } from "./env";

export const pool = env.db.connectionString
  ? new Pool({
      connectionString: env.db.connectionString,
      // Provedores de Postgres na nuvem (Neon, Supabase, etc.) exigem SSL;
      // rejectUnauthorized:false porque o certificado deles nao esta na CA
      // padrao do Node, mas a conexao em si continua criptografada.
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database,
    });

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return pool.query<T>(text, params);
}
