import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  db: {
    // Em producao (Vercel + Postgres na nuvem, ex: Neon) usa-se uma unica
    // connection string com SSL; localmente continua PGHOST/PGPORT/etc.
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? 5432),
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "postgres",
    database: process.env.PGDATABASE ?? "projeto_tcc",
  },
  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  // Aceita uma lista separada por virgulas (painel admin + qualquer origem
  // extra), ou "*" pra liberar geral — o app mobile nativo nao e afetado por
  // CORS de qualquer forma, isso so protege quem acessa a API via browser.
  corsOrigin:
    process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : "*",
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET_NAME ?? "projetotcc",
  },
};
