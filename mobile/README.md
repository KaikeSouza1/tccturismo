# Mobile — Turismo Local

Aplicativo React + TypeScript voltado ao turista: autenticação, leitura de
QR Code, registro de visitas por geolocalização (geofencing), gamificação
(conquistas, pontos, ranking) e funcionamento offline. Empacotado como APK
Android via [Capacitor](https://capacitorjs.com/).

## Pré-requisitos

- Node.js 20+
- Para gerar o APK: Android Studio + SDK (JDK 21 — usar o JBR que acompanha
  o Android Studio, não o Java do PATH)
- O [backend](../backend) rodando (local ou já publicado) acessível pela
  URL configurada em `VITE_API_URL`

## Instalação

```bash
npm install
```

## Variáveis de ambiente

- `.env` — usado por `npm run dev` (ambiente local)
- `.env.production` — usado por `npm run build` (empacotado no APK)

Ambos têm uma única chave:

```
VITE_API_URL=http://localhost:3333/api
```

Aponte para a URL real do backend em produção no `.env.production` antes de
gerar o APK.

## Rodando em desenvolvimento

```bash
npm run dev
```

Como o app é essencialmente uma aplicação web (Capacitor empacota a mesma
base web), dá pra desenvolver e testar a maior parte das telas direto no
navegador, sem precisar gerar um APK a cada mudança — só os plugins nativos
(câmera, GPS, etc.) exigem o app rodando no dispositivo/emulador.

## Testes

```bash
npm test
```

## Gerando o APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK gerado em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Arquitetura

- `src/screens/` — uma tela por rota
- `src/components/` — componentes de UI e layout reutilizáveis
- `src/lib/` — API client, geolocalização, fila offline/sincronização,
  OSRM (distância real por rota), etc.
- Offline-first: visitas registradas sem conexão ficam em fila local
  (`src/lib/offline-queue.ts`) e são sincronizadas automaticamente quando a
  conexão volta (`src/lib/sync.ts`).
