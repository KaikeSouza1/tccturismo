import "dotenv/config";

const missing: string[] = [];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    missing.push(name);
    return "";
  }
  return value;
}

const databaseUrl = process.env.DATABASE_URL;

// Dois jeitos validos de conectar no banco: DATABASE_URL (Postgres gerenciado
// na nuvem, ex: Neon) OU as variaveis PG* discretas (VPS proprio, uso atual
// em producao). Sao mutuamente exclusivos — se DATABASE_URL existir, as PG*
// nao precisam existir, e vice-versa (ver config/db.ts).
let dbHost = "";
let dbPort = "";
let dbUser = "";
let dbPassword = "";
let dbDatabase = "";
if (!databaseUrl) {
  dbHost = required("PGHOST");
  dbPort = required("PGPORT");
  dbUser = required("PGUSER");
  dbPassword = required("PGPASSWORD");
  dbDatabase = required("PGDATABASE");
}

const jwtSecret = required("JWT_SECRET");

const r2AccountId = required("R2_ACCOUNT_ID");
const r2AccessKeyId = required("R2_ACCESS_KEY_ID");
const r2SecretAccessKey = required("R2_SECRET_ACCESS_KEY");
const r2Bucket = required("R2_BUCKET_NAME");

if (missing.length > 0) {
  throw new Error(
    `Variaveis de ambiente obrigatorias ausentes: ${missing.join(", ")}. Veja .env.example.`
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3333),
  db: {
    connectionString: databaseUrl,
    host: dbHost,
    port: Number(dbPort || 5432),
    user: dbUser,
    password: dbPassword,
    database: dbDatabase,
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  // CORS_ORIGIN nao entra na validacao obrigatoria acima: ausente, o valor
  // "*" e um default deliberado e seguro (ja documentado no .env.example),
  // nao um retorno vazio mascarando configuracao faltante como acontecia
  // antes com banco/R2.
  corsOrigin:
    process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : "*",
  r2: {
    accountId: r2AccountId,
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
    bucket: r2Bucket,
  },
};
