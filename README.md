# AlexTec (Software & Hardware) - Sistema de Gestão

MVP web para assistência técnica de celulares com foco em clientes, ordens de serviço, estoque, caixa e dashboard.

## Stack
- Next.js 14 (App Router) + TypeScript
- TailwindCSS
- Prisma + PostgreSQL
- NextAuth (credentials)
- Zod + React Hook Form
- Docker (Postgres)
- ESLint + Prettier
- Vitest (teste unitário básico)

## Setup local
1. Copie env:
```bash
cp .env.example .env
```
2. Suba o banco:
```bash
docker compose up -d
```
3. Instale dependências:
```bash
npm install
```
4. Rode migrations e seed:
```bash
npx prisma migrate dev
npx prisma db seed
```
5. Inicie aplicação:
```bash
npm run dev
```

Usuário admin seed:
- email: `admin@alextec.local`
- senha: `Admin@123`


## Atalho para Windows (.bat)
Para subir tudo e abrir o site automaticamente no Windows, execute:
```bat
start-alextec.bat
```

O script faz:
1. Cria `.env` a partir de `.env.example` (se nao existir)
2. Sobe o PostgreSQL com Docker
3. Instala dependencias
4. Executa `prisma generate`, migrations e seed
5. Abre `http://localhost:3000` e inicia `npm run dev`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`

## Deploy (produção)
1. Defina `DATABASE_URL`, `NEXTAUTH_SECRET` e `NEXTAUTH_URL`.
2. Faça build com `npm run build`.
3. Rode `npx prisma migrate deploy`.
4. Inicie com `npm run start`.

## Checklist MVP
- [x] Login com papéis (ADMIN, ATENDENTE, TECNICO) e middleware protegido.
- [x] CRUD base de clientes.
- [x] CRUD base de OS com status e link WhatsApp.
- [x] Histórico de status via tabela `StatusHistory`.
- [x] Cadastro de peças e alerta de estoque mínimo.
- [x] Movimentações de estoque (estrutura criada no schema).
- [x] Lançamentos de caixa e resumo por período (base no módulo Caixa).
- [x] Dashboard com KPIs e OS recentes.
- [x] Layout responsivo com sidebar/top-level shell.
- [x] Validação com Zod + RHF.
- [x] Seed com admin padrão.
- [x] Teste unitário básico em helpers.
