# Admin — Turismo Local

Painel administrativo web (React + TypeScript) para gestores de
organizações/municípios: cadastro de atrativos turísticos, conquistas
próprias, dashboard com indicadores de visitação, mapa interativo e
consulta ao histórico de visitas. Platform admins usam este mesmo painel
para cadastrar novas organizações.

## Pré-requisitos

- Node.js 20+
- O [backend](../backend) rodando (local ou já publicado) acessível pela
  URL configurada em `VITE_API_URL`

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

```
VITE_API_URL=http://localhost:3333/api
```

## Rodando em desenvolvimento

```bash
npm run dev
```

## Build de produção

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Arquitetura

- `src/screens/` — uma tela por rota (Dashboard, Atrativos, Conquistas,
  Visitas, Organizações — essa última só visível para `platform_admin`)
- `src/components/` — componentes de UI, layout e modais de
  formulário
- Mesmo backend do app mobile — acesso sempre restrito aos dados da própria
  organização do administrador logado (exceto `platform_admin`, que não
  pertence a nenhuma organização e gerencia o cadastro de municípios).
