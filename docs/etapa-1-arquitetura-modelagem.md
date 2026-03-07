# Etapa 1 — Arquitetura Completa e Modelagem de Banco

## 1) Arquitetura do Sistema (visão completa)

## 1.1 Objetivo da arquitetura
Construir um sistema web administrativo para assistência técnica com foco em:
- escalabilidade por módulos;
- rastreabilidade de operações críticas (OS, estoque, caixa e financeiro);
- tipagem forte e manutenção simples;
- experiência responsiva para desktop e mobile.

## 1.2 Stack técnica (alvo)
- **Frontend/Backend:** Next.js (App Router) + TypeScript
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **UI:** Tailwind CSS + componentes reutilizáveis
- **Autenticação:** sessão com credenciais (Auth.js/NextAuth) + RBAC

## 1.3 Estilo arquitetural
Arquitetura **modular em camadas**:
- **Camada de apresentação:** páginas, layouts e componentes UI.
- **Camada de aplicação:** casos de uso/regras de negócio por módulo.
- **Camada de dados:** repositórios Prisma e queries.
- **Camada de integração:** rotas/API (`/api/*`) e validações.

## 1.4 Módulos de domínio
1. Login e usuários
2. Dashboard
3. Clientes
4. Aparelhos
5. Serviços
6. Produtos
7. Ordens de serviço
8. Estoque
9. Caixa
10. Vendas
11. Financeiro
12. Relatórios

## 1.5 Fluxos críticos de negócio
- **OS:** abre OS com cliente + aparelho + laudo/defeito + técnico + itens (serviços/peças), acompanha status, entrega e histórico.
- **Estoque:** toda entrada/saída/ajuste gera movimentação com origem (OS, venda, ajuste manual etc.).
- **Vendas balcão:** baixa estoque, lança caixa e gera registro financeiro.
- **Caixa:** abertura/fechamento por sessão, entradas/saídas por forma de pagamento.
- **Financeiro:** contas a pagar/receber, faturamento, despesas, lucro e fluxo de caixa por período.

## 1.6 Estrutura de pastas proposta (Next.js)
```txt
src/
  app/
    (public)/
      login/
    (admin)/
      dashboard/
      clientes/
      aparelhos/
      servicos/
      produtos/
      os/
      estoque/
      caixa/
      vendas/
      financeiro/
      relatorios/
    api/
      auth/
      clientes/
      aparelhos/
      servicos/
      produtos/
      os/
      estoque/
      caixa/
      vendas/
      financeiro/
      relatorios/
  modules/
    auth/
    usuarios/
    clientes/
    aparelhos/
    servicos/
    produtos/
    os/
    estoque/
    caixa/
    vendas/
    financeiro/
    relatorios/
  components/
    ui/
    forms/
    tables/
    cards/
    charts/
  lib/
    prisma/
    auth/
    validations/
    permissions/
  types/
prisma/
  schema.prisma
  migrations/
```

## 1.7 Organização interna por módulo
Cada módulo deve ter padrão consistente:
- `schemas/` (Zod)
- `services/` (casos de uso)
- `repositories/` (acesso Prisma)
- `api/` (handlers)
- `components/` (componentes específicos)

## 1.8 Segurança e permissões
- Autenticação por sessão.
- RBAC por perfil (`ADMIN`, `GERENTE`, `TECNICO`, `ATENDENTE`, `CAIXA`, `ESTOQUISTA`, `FINANCEIRO`).
- Permissões por ação (ex.: `os:update`, `estoque:adjust`, `caixa:close`, `financeiro:view`).

## 1.9 Validação e consistência
- Validação de entrada com Zod em formulários e rotas.
- Operações críticas em transações Prisma (`$transaction`):
  - entrega de OS;
  - venda de balcão;
  - fechamento de caixa;
  - liquidação financeira.

## 1.10 Responsividade e UX
- Layout administrativo com sidebar e header fixo.
- Tabelas com busca, filtros e paginação.
- Formulários otimizados para operação rápida.
- Dashboard com cards, gráficos e indicadores-chave.

---

## 2) Modelagem de Banco de Dados (PostgreSQL + Prisma)

## 2.1 Entidades principais

### Acesso e usuários
- `User`
- `Role`
- `UserRole`

### Cadastros
- `Customer` (cliente)
- `Device` (aparelho do cliente)
- `ServiceCatalog` (serviços)
- `Product` (produtos/peças)

### Ordens de serviço
- `ServiceOrder`
- `ServiceOrderServiceItem`
- `ServiceOrderProductItem`
- `ServiceOrderHistory`

### Estoque
- `StockMovement`

### Caixa e vendas
- `CashSession`
- `CashTransaction`
- `CounterSale`
- `CounterSaleItem`

### Financeiro
- `FinancialCategory`
- `FinancialEntry`

## 2.2 Relacionamentos essenciais
- `Customer 1:N Device`
- `Customer 1:N ServiceOrder`
- `Device 1:N ServiceOrder`
- `ServiceOrder N:1 User (technician)`
- `ServiceOrder 1:N ServiceOrderServiceItem`
- `ServiceOrder 1:N ServiceOrderProductItem`
- `ServiceOrder 1:N ServiceOrderHistory`
- `Product 1:N StockMovement`
- `CashSession 1:N CashTransaction`
- `CounterSale 1:N CounterSaleItem`
- `FinancialCategory 1:N FinancialEntry`

## 2.3 Enums de domínio
- `OsStatus`: `ABERTA`, `EM_ANALISE`, `AGUARDANDO_PECA`, `EM_MANUTENCAO`, `PRONTA`, `ENTREGUE`, `CANCELADA`
- `StockMovementType`: `ENTRADA`, `SAIDA`, `AJUSTE`
- `PaymentMethod`: `DINHEIRO`, `PIX`, `CARTAO`, `BOLETO`
- `CashTransactionType`: `ENTRADA`, `SAIDA`
- `FinancialEntryType`: `PAGAR`, `RECEBER`
- `FinancialEntryStatus`: `ABERTO`, `PAGO`, `CANCELADO`

## 2.4 Regras de integridade
- Não permitir estoque negativo.
- Toda movimentação de estoque deve ter origem e justificativa.
- Toda movimentação financeira deve ficar registrada.
- Entrega de OS deve baixar peças e registrar financeiro/caixa quando aplicável.
- Venda balcão deve baixar estoque e gerar lançamento financeiro.

---

## 3) Prisma Schema Base (proposta inicial)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum OsStatus {
  ABERTA
  EM_ANALISE
  AGUARDANDO_PECA
  EM_MANUTENCAO
  PRONTA
  ENTREGUE
  CANCELADA
}

enum StockMovementType {
  ENTRADA
  SAIDA
  AJUSTE
}

enum PaymentMethod {
  DINHEIRO
  PIX
  CARTAO
  BOLETO
}

enum CashTransactionType {
  ENTRADA
  SAIDA
}

enum FinancialEntryType {
  PAGAR
  RECEBER
}

enum FinancialEntryStatus {
  ABERTO
  PAGO
  CANCELADO
}

model User {
  id          String      @id @default(cuid())
  name        String
  email       String      @unique
  passwordHash String
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  userRoles   UserRole[]
  serviceOrders ServiceOrder[] @relation("TechnicianOrders")
}

model Role {
  id        String     @id @default(cuid())
  name      String     @unique
  userRoles UserRole[]
}

model UserRole {
  id      String @id @default(cuid())
  userId  String
  roleId  String
  user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  role    Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
}

model Customer {
  id        String       @id @default(cuid())
  name      String
  phone     String
  email     String?
  document  String?
  notes     String?
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  devices   Device[]
  serviceOrders ServiceOrder[]

  @@index([name])
  @@index([phone])
}

model Device {
  id          String   @id @default(cuid())
  customerId  String
  brand       String
  model       String
  imei        String?
  serial      String?
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  customer    Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  serviceOrders ServiceOrder[]

  @@index([customerId])
  @@index([imei])
  @@index([brand, model])
}

model ServiceCatalog {
  id          String   @id @default(cuid())
  name        String
  description String?
  basePrice   Decimal  @db.Decimal(12, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  serviceOrderItems ServiceOrderServiceItem[]

  @@index([name])
}

model Product {
  id          String   @id @default(cuid())
  name        String
  category    String
  sku         String   @unique
  costPrice   Decimal  @db.Decimal(12, 2)
  salePrice   Decimal  @db.Decimal(12, 2)
  stockQty    Int      @default(0)
  minStock    Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  stockMovements StockMovement[]
  orderProductItems ServiceOrderProductItem[]
  saleItems CounterSaleItem[]

  @@index([name])
  @@index([category])
  @@index([stockQty, minStock])
}

model ServiceOrder {
  id                String   @id @default(cuid())
  osNumber           Int      @unique
  customerId         String
  deviceId           String
  technicianId       String?
  reportedIssue      String
  diagnosis          String?
  technicalNotes     String?
  passwordPattern    String?
  entryState         String?
  estimatedDelivery  DateTime?
  status             OsStatus @default(ABERTA)
  totalValue         Decimal  @db.Decimal(12, 2)
  openedAt           DateTime @default(now())
  deliveredAt        DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  customer           Customer @relation(fields: [customerId], references: [id])
  device             Device   @relation(fields: [deviceId], references: [id])
  technician         User?    @relation("TechnicianOrders", fields: [technicianId], references: [id])

  serviceItems       ServiceOrderServiceItem[]
  productItems       ServiceOrderProductItem[]
  historyItems       ServiceOrderHistory[]
  financialEntries   FinancialEntry[]

  @@index([status])
  @@index([openedAt])
  @@index([customerId])
}

model ServiceOrderServiceItem {
  id             String   @id @default(cuid())
  serviceOrderId String
  serviceId      String
  quantity       Int      @default(1)
  unitPrice      Decimal  @db.Decimal(12, 2)
  totalPrice     Decimal  @db.Decimal(12, 2)

  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  service        ServiceCatalog @relation(fields: [serviceId], references: [id])

  @@index([serviceOrderId])
  @@index([serviceId])
}

model ServiceOrderProductItem {
  id             String   @id @default(cuid())
  serviceOrderId String
  productId      String
  quantity       Int
  unitPrice      Decimal  @db.Decimal(12, 2)
  totalPrice     Decimal  @db.Decimal(12, 2)

  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  product        Product @relation(fields: [productId], references: [id])

  @@index([serviceOrderId])
  @@index([productId])
}

model ServiceOrderHistory {
  id             String   @id @default(cuid())
  serviceOrderId String
  fromStatus     OsStatus?
  toStatus       OsStatus
  description    String
  changedById    String?
  createdAt      DateTime @default(now())

  serviceOrder   ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)

  @@index([serviceOrderId, createdAt])
}

model StockMovement {
  id            String            @id @default(cuid())
  productId     String
  type          StockMovementType
  quantity      Int
  unitCost      Decimal?          @db.Decimal(12, 2)
  reason        String
  referenceType String
  referenceId   String?
  createdAt     DateTime          @default(now())

  product       Product           @relation(fields: [productId], references: [id])

  @@index([productId, createdAt])
  @@index([referenceType, referenceId])
}

model CashSession {
  id            String   @id @default(cuid())
  openedById    String?
  openedAt      DateTime @default(now())
  openingAmount Decimal  @db.Decimal(12, 2)
  closedAt      DateTime?
  closingAmount Decimal? @db.Decimal(12, 2)
  expectedAmount Decimal? @db.Decimal(12, 2)
  status        String   @default("ABERTO")

  transactions  CashTransaction[]
  sales         CounterSale[]

  @@index([openedAt])
  @@index([status])
}

model CashTransaction {
  id            String              @id @default(cuid())
  cashSessionId String
  type          CashTransactionType
  category      String
  description   String
  paymentMethod PaymentMethod
  amount        Decimal             @db.Decimal(12, 2)
  createdAt     DateTime            @default(now())

  cashSession   CashSession         @relation(fields: [cashSessionId], references: [id], onDelete: Cascade)

  @@index([cashSessionId, createdAt])
  @@index([type, createdAt])
}

model CounterSale {
  id            String        @id @default(cuid())
  cashSessionId String
  paymentMethod PaymentMethod
  total         Decimal       @db.Decimal(12, 2)
  createdAt     DateTime      @default(now())

  cashSession   CashSession   @relation(fields: [cashSessionId], references: [id], onDelete: Cascade)
  items         CounterSaleItem[]
  financialEntries FinancialEntry[]

  @@index([createdAt])
  @@index([cashSessionId])
}

model CounterSaleItem {
  id            String   @id @default(cuid())
  counterSaleId String
  productId     String
  quantity      Int
  unitPrice     Decimal  @db.Decimal(12, 2)
  unitCost      Decimal  @db.Decimal(12, 2)
  total         Decimal  @db.Decimal(12, 2)

  counterSale   CounterSale @relation(fields: [counterSaleId], references: [id], onDelete: Cascade)
  product       Product     @relation(fields: [productId], references: [id])

  @@index([counterSaleId])
  @@index([productId])
}

model FinancialCategory {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String
  createdAt   DateTime @default(now())

  entries     FinancialEntry[]
}

model FinancialEntry {
  id                String               @id @default(cuid())
  type              FinancialEntryType
  categoryId        String
  description       String
  amount            Decimal              @db.Decimal(12, 2)
  dueDate           DateTime
  status            FinancialEntryStatus @default(ABERTO)
  paidAt            DateTime?
  paymentMethod     PaymentMethod?
  referenceType     String?
  serviceOrderId    String?
  counterSaleId     String?
  createdAt         DateTime             @default(now())

  category          FinancialCategory    @relation(fields: [categoryId], references: [id])
  serviceOrder      ServiceOrder?        @relation(fields: [serviceOrderId], references: [id])
  counterSale       CounterSale?         @relation(fields: [counterSaleId], references: [id])

  @@index([type, status])
  @@index([dueDate])
  @@index([paidAt])
  @@index([referenceType])
}
```

---

## 4) Estratégia de consultas e performance

## 4.1 Índices obrigatórios
- Busca operacional:
  - `ServiceOrder(status, openedAt)`
  - `Customer(name)`
  - `Device(imei)`
  - `Product(category, stockQty, minStock)`
- Financeiro:
  - `FinancialEntry(type, status, dueDate, paidAt)`
  - `CashTransaction(type, createdAt)`
- Estoque:
  - `StockMovement(productId, createdAt)` e `StockMovement(referenceType, referenceId)`

## 4.2 KPIs e relatórios
- Usar agregações SQL/Prisma por período (`groupBy`, `sum`, `count`).
- Evitar carregar histórico completo quando apenas totalizadores são necessários.
- Paginação e filtros para listas grandes.

## 4.3 Transações críticas
Sempre com `prisma.$transaction`:
- Entrega de OS (status + baixa estoque + financeiro + caixa + histórico).
- Venda balcão (baixa estoque + caixa + financeiro + item de venda).
- Fechamento de caixa (snapshot de esperado vs. informado).

---

## 5) Checklist da Etapa 1 (concluída)
- [x] Arquitetura completa definida por módulos e camadas.
- [x] Estrutura de projeto alvo em Next.js especificada.
- [x] Modelagem relacional com entidades e regras de negócio.
- [x] Prisma Schema base proposto (pronto para etapa de implementação).
- [x] Estratégia de performance e transações documentada.

## 6) Próximos passos (Etapa 2)
1. Transformar o schema proposto em `prisma/schema.prisma` real.
2. Criar primeiras migrations (auth/cadastros/os/estoque).
3. Criar seed inicial com papéis, usuário admin e categorias financeiras.
4. Definir DTOs/validações Zod espelhando as tabelas.
