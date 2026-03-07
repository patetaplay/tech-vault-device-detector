# Tech Vault MVP

MVP funcional para assistência técnica de celulares com dados mockados em `localStorage`, arquitetura modular e foco nos fluxos críticos de operação.

## Funcionalidades implementadas (prioridade solicitada)
1. Login
2. Dashboard inicial
3. Cadastro de clientes
4. Cadastro de produtos
5. Cadastro de serviços
6. Abertura de ordem de serviço
7. Fechamento de OS com cálculo de valor
8. Baixa automática de estoque ao fechar OS
9. Tela de caixa (abertura/fechamento, entradas/saídas, resumo diário, histórico)
10. Vendas no balcão com baixa automática de estoque
11. Relatório financeiro básico diário
12. Módulo de estoque completo (movimentações, ajustes, alertas e relatório)
13. Módulo financeiro completo (contas a pagar/receber, KPIs, lucro, fluxo e períodos)

## Estrutura de pastas
```txt
.
├── dist/
├── docs/
│   └── plano-tecnico.md
├── src/
│   ├── components/
│   │   └── ui.ts
│   ├── core/
│   │   ├── format.ts
│   │   ├── session.ts
│   │   ├── types.ts
│   │   └── validation.ts
│   ├── modules/
│   │   ├── api/
│   │   │   ├── cashApi.ts
│   │   │   ├── salesApi.ts
│   │   │   ├── stockApi.ts
│   │   │   └── financeApi.ts
│   │   ├── pages/
│   │   │   ├── auth.ts
│   │   │   ├── cash.ts
│   │   │   ├── customers.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── finance.ts
│   │   │   ├── orders.ts
│   │   │   ├── products.ts
│   │   │   ├── inventory.ts
│   │   │   ├── stockReport.ts
│   │   │   ├── sales.ts
│   │   │   └── services.ts
│   │   └── store.ts
│   ├── styles/
│   │   └── app.css
│   ├── main.ts
│   └── types.ts
├── index.html
├── package.json
├── server.js
└── tsconfig.json
```

## Arquivos criados/atualizados nesta entrega
- `src/main.ts`
- `src/components/ui.ts`
- `src/core/format.ts`
- `src/core/session.ts`
- `src/core/types.ts`
- `src/core/validation.ts`
- `src/modules/pages/auth.ts`
- `src/modules/pages/dashboard.ts`
- `src/modules/pages/customers.ts`
- `src/modules/pages/products.ts`
- `src/modules/pages/inventory.ts`
- `src/modules/pages/stockReport.ts`
- `src/modules/pages/services.ts`
- `src/modules/pages/orders.ts`
- `src/modules/pages/cash.ts`
- `src/modules/pages/finance.ts`
- `src/modules/pages/sales.ts`
- `src/modules/api/cashApi.ts`
- `src/modules/api/salesApi.ts`
- `src/modules/api/stockApi.ts`
- `src/modules/api/financeApi.ts`
- `src/modules/store.ts`
- `src/styles/app.css`
- `README.md`

## Como rodar localmente
```bash
npm run build
npm run start
```

Para validar regras de negócio automaticamente:
```bash
npm run test
```
Acesse: `http://localhost:3000`

Credenciais demo:
- `admin@techvault.local`
- `123456`

## O que ainda falta
- Implementar stack final solicitada (Next.js + Tailwind + Prisma + PostgreSQL) no lugar da versão mock.
- Autenticação/Autorização robusta com backend e perfis por permissão (RBAC real).
- API persistente com validações no servidor e auditoria.
- Expandir suíte de testes automatizados (unitário, integração e E2E).
- Relatórios avançados com filtros por período/técnico/status e exportação.
