# Backend — Turismo Local

API RESTful em Node.js + TypeScript do sistema de registro, gamificação e
valorização de visitas a atrativos turísticos. Expõe os dados consumidos
pelo aplicativo mobile (turistas) e pelo painel administrativo web
(gestores de organizações/municípios).

## Pré-requisitos

- Node.js 20+
- Um banco PostgreSQL acessível (local ou remoto)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

Variáveis obrigatórias (o servidor recusa subir se alguma faltar — ver
`src/config/env.ts`):

- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` — conexão com o
  Postgres. **Ou**, alternativamente, `DATABASE_URL` sozinha (connection
  string única, usada por provedores gerenciados como Neon/Supabase) — nesse
  caso as variáveis `PG*` não são necessárias.
- `JWT_SECRET` — chave de assinatura dos tokens de autenticação.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET_NAME` — credenciais do bucket Cloudflare R2 usado para as fotos
  dos atrativos e das visitas.

Variáveis opcionais (têm valor padrão): `NODE_ENV`, `PORT`, `JWT_EXPIRES_IN`,
`CORS_ORIGIN` (default `*`).

## Banco de dados

```bash
npm run migrate      # aplica as migrations pendentes em src/db/migrations
npm run seed         # popula dados iniciais (organização, admin, atrativos, conquistas)
npm run create-org   # cria uma organização (município) + admin, via CLI
```

## Rodando em desenvolvimento

```bash
npm run dev
```

Sobe em `http://localhost:3333` (ou na porta definida em `PORT`), com
reload automático.

## Testes

```bash
npm test
```

## Build de produção

```bash
npm run build   # gera dist/
npm start       # roda dist/server.js
```

Em produção (Vercel), o ponto de entrada é `api/index.ts`, que reexporta o
mesmo app Express — `vercel.json` reescreve todas as rotas para ele.

## Arquitetura

- Acesso ao banco via **SQL nativo** (`pg`), sem ORM — queries ficam em
  `src/modules/*/\*.service.ts`.
- Organizado por módulo de domínio: `auth`, `attractions`, `visits`,
  `achievements`, `organizations`, `dashboard`.
- Autenticação via JWT (`src/middleware/auth.middleware.ts`), com três
  papéis: `tourist`, `admin` (de uma organização) e `platform_admin`.
