# Plano Técnico — Sistema Web de Controle Financeiro para Assistência Técnica de Celulares

## 1) Arquitetura do Sistema

### 1.1 Visão geral
Arquitetura em camadas, orientada a domínio de negócio, com foco em escalabilidade e manutenção:

- **Frontend (Next.js + TypeScript + Tailwind CSS)**
  - App Router (`/app`), componentes server/client quando apropriado.
  - UI responsiva (desktop e mobile-first).
  - Módulos por domínio (OS, Caixa, Estoque, Financeiro, Cadastros, Relatórios).
- **Backend (Next.js Route Handlers + Services)**
  - API interna RESTful em `/app/api/*`.
  - Camada de serviços para regras de negócio.
  - Camada de acesso a dados com Prisma.
- **Banco de dados (PostgreSQL)**
  - Modelagem relacional normalizada.
  - Auditoria de movimentações financeiras e de estoque.
- **Autenticação e autorização**
  - Sessão/autenticação (ex.: NextAuth/Auth.js).
  - RBAC por perfil (Admin, Gerente, Técnico, Caixa, Estoquista, Financeiro, Atendente).

### 1.2 Princípios de design
- **Separação de responsabilidades**: UI, aplicação, domínio e persistência isolados.
- **Escalabilidade**: módulos independentes e serviços reutilizáveis.
- **Rastreabilidade**: eventos financeiros e de estoque sempre com histórico.
- **Confiabilidade**: transações atômicas para operações críticas (fechamento de OS, baixa de peças, lançamento de caixa).
- **Segurança**: controle de acesso por ação e por módulo.

### 1.3 Estrutura de pastas sugerida
```txt
src/
  app/
    (auth)/
    (dashboard)/
      os/
      caixa/
      estoque/
      financeiro/
      clientes/
      aparelhos/
      catalogo/
      relatorios/
    api/
      os/
      caixa/
      estoque/
      financeiro/
      clientes/
      aparelhos/
      catalogo/
      relatorios/
  components/
    ui/
    forms/
    tables/
    charts/
  modules/
    os/
    caixa/
    estoque/
    financeiro/
    clientes/
    aparelhos/
    catalogo/
    relatorios/
  lib/
    auth/
    prisma/
    validations/
    permissions/
  types/
prisma/
  schema.prisma
  migrations/
```

### 1.4 Estratégia de permissões (RBAC)
Perfis e escopos sugeridos:
- **Admin**: acesso total.
- **Gerente**: quase total, sem gestão crítica de usuários/sistema.
- **Técnico**: acesso completo a OS atribuídas, leitura parcial de estoque.
- **Caixa**: caixa de vendas e recebimentos/pagamentos.
- **Estoquista**: catálogo de produtos/peças e movimentações de estoque.
- **Financeiro**: DRE simplificado, fluxo de caixa, despesas, faturamento.
- **Atendente**: abertura de OS, cadastro de cliente/aparelho, consultas.

Permissões por ação (exemplos):
- `os:create`, `os:update_status`, `os:close`
- `caixa:open`, `caixa:entry`, `caixa:exit`, `caixa:close`
- `estoque:entry`, `estoque:exit`, `estoque:adjust`
- `financeiro:view_reports`

### 1.5 Responsividade e UX
- Layout com sidebar adaptável + navegação inferior no mobile.
- Tabelas com modo compacto e filtros colapsáveis em telas pequenas.
- Formulários longos em etapas (wizard), especialmente para OS.
- Dashboard com cards e gráficos que reorganizam por breakpoint.

---

## 2) Modelagem do Banco de Dados

## 2.1 Entidades principais

### Segurança e usuários
- `User` (usuário do sistema)
- `Role` (perfil)
- `UserRole` (N:N)

### Cadastros
- `Customer` (cliente)
- `Device` (aparelho do cliente)
- `ServiceCatalog` (serviços prestados)
- `Product` (peças/produtos)
- `Supplier` (fornecedor opcional)

### Ordem de Serviço
- `ServiceOrder`
- `ServiceOrderItem` (itens de serviço/produto)
- `ServiceOrderStatusHistory`

### Estoque
- `StockMovement`
- `InventoryBalance` (opcional para saldo consolidado por produto)

### Caixa e Financeiro
- `CashSession` (abertura/fechamento de caixa)
- `CashTransaction` (entrada/saída)
- `FinancialTransaction` (receita/despesa/transferência)
- `ExpenseCategory`
- `PaymentMethod`

## 2.2 Relacionamentos críticos
- `Customer 1:N Device`
- `Customer 1:N ServiceOrder`
- `Device 1:N ServiceOrder`
- `ServiceOrder N:1 User (technician)`
- `ServiceOrder 1:N ServiceOrderItem`
- `Product 1:N ServiceOrderItem` (quando item é peça/produto)
- `ServiceCatalog 1:N ServiceOrderItem` (quando item é serviço)
- `Product 1:N StockMovement`
- `CashSession 1:N CashTransaction`
- `ServiceOrder 1:N FinancialTransaction` (receita vinculada)

## 2.3 Campos essenciais por tabela (resumo)
- **ServiceOrder**:
  - `id`, `code`, `customerId`, `deviceId`, `technicianId`
  - `reportedIssue`, `diagnosis`, `status`
  - `laborValue`, `partsValue`, `discountValue`, `totalValue`
  - `openedAt`, `approvedAt`, `completedAt`, `deliveredAt`, `createdAt`, `updatedAt`
- **ServiceOrderItem**:
  - `id`, `serviceOrderId`, `type` (`SERVICE` | `PRODUCT`)
  - `serviceCatalogId?`, `productId?`, `description`
  - `quantity`, `unitCost`, `unitPrice`, `totalPrice`
- **Product**:
  - `id`, `sku`, `name`, `category`, `costPrice`, `salePrice`, `minStock`, `isActive`
- **StockMovement**:
  - `id`, `productId`, `type` (`IN` | `OUT` | `ADJUSTMENT`)
  - `quantity`, `unitCost`, `referenceType`, `referenceId`, `notes`, `createdBy`, `createdAt`
- **CashTransaction**:
  - `id`, `cashSessionId`, `type` (`ENTRY` | `EXIT`)
  - `amount`, `paymentMethodId`, `description`, `referenceType`, `referenceId`, `createdBy`, `createdAt`
- **FinancialTransaction**:
  - `id`, `type` (`REVENUE` | `EXPENSE`)
  - `categoryId`, `amount`, `dueDate`, `paidAt`, `status`, `paymentMethodId`, `serviceOrderId?`

## 2.4 Regras de integridade e negócio
- Fechamento de OS deve:
  1) validar status permitido;
  2) gerar receita no financeiro;
  3) lançar saída de estoque para peças consumidas;
  4) registrar histórico de status.
- Movimentação de estoque nunca deve permitir saldo negativo (configurável).
- Caixa diário deve exigir abertura para registrar transações.
- Alterações críticas (estorno, cancelamento, ajuste de estoque) devem gerar trilha de auditoria.

---

## 3) Lista de Páginas

### 3.1 Autenticação e sistema
- `/login`
- `/recuperar-senha`
- `/perfil`
- `/usuarios` (admin)
- `/permissoes` (admin)

### 3.2 Dashboard e relatórios
- `/dashboard`
- `/relatorios/os`
- `/relatorios/financeiro`
- `/relatorios/estoque`
- `/relatorios/vendas`

### 3.3 Ordem de serviço
- `/os` (listagem + filtros)
- `/os/nova`
- `/os/[id]` (detalhes)
- `/os/[id]/editar`
- `/os/[id]/timeline`

### 3.4 Caixa
- `/caixa` (sessão atual)
- `/caixa/abrir`
- `/caixa/fechar`
- `/caixa/movimentacoes`
- `/caixa/historico`

### 3.5 Estoque
- `/estoque` (saldo e alertas)
- `/estoque/produtos`
- `/estoque/produtos/novo`
- `/estoque/movimentacoes`
- `/estoque/ajustes`

### 3.6 Financeiro
- `/financeiro` (visão geral)
- `/financeiro/receitas`
- `/financeiro/despesas`
- `/financeiro/fluxo-caixa`
- `/financeiro/contas-a-receber`
- `/financeiro/contas-a-pagar`

### 3.7 Cadastros
- `/clientes`
- `/clientes/novo`
- `/clientes/[id]`
- `/aparelhos`
- `/aparelhos/novo`
- `/catalogo/servicos`
- `/catalogo/produtos`

---

## 4) Lista de Funcionalidades por Módulo

## 4.1 Módulo de Ordens de Serviço (OS)
- Criar OS vinculando cliente e aparelho.
- Registrar defeito relatado, diagnóstico e observações.
- Atribuir técnico responsável.
- Adicionar itens de serviço e peças.
- Calcular total automaticamente (mão de obra + peças - desconto).
- Gerenciar status (`ABERTA`, `EM_ANALISE`, `AGUARDANDO_APROVACAO`, `EM_REPARO`, `PRONTA`, `ENTREGUE`, `CANCELADA`).
- Histórico de alterações de status e usuário responsável.
- Geração de comprovante/orçamento.

## 4.2 Módulo de Caixa
- Abertura e fechamento de caixa por usuário/turno.
- Registro de entradas (vendas, recebimentos) e saídas (sangrias, despesas).
- Conciliação por forma de pagamento (dinheiro, PIX, cartão, etc.).
- Histórico de sessões e divergências de fechamento.

## 4.3 Módulo de Estoque
- Cadastro de peças/produtos e preços.
- Entrada por compra/reposição.
- Saída por consumo em OS ou venda avulsa.
- Ajuste manual com motivo obrigatório.
- Alerta de estoque mínimo.
- Histórico de movimentações com referência (OS, ajuste, compra).

## 4.4 Módulo Financeiro Geral
- Lançamentos de receitas e despesas.
- Classificação por categoria.
- Contas a pagar/receber com status.
- Visão de lucro, despesas e faturamento por período.
- Fluxo de caixa diário/semanal/mensal.
- Indicadores: ticket médio, margem bruta, custo com peças.

## 4.5 Módulo de Clientes
- CRUD completo de clientes.
- Histórico de OS por cliente.
- Contatos e dados fiscais.

## 4.6 Módulo de Aparelhos
- Cadastro de aparelhos (marca, modelo, IMEI/serial).
- Vínculo com cliente.
- Histórico técnico por aparelho.

## 4.7 Módulo de Serviços e Produtos (Catálogo)
- Cadastro de serviços padronizados com preço base.
- Cadastro de produtos/peças com custo e preço.
- Ativação/inativação de itens.

## 4.8 Relatórios e Dashboard
- Dashboard com KPIs principais:
  - OS abertas/fechadas no período
  - faturamento
  - despesas
  - lucro estimado
  - produtos com baixo estoque
- Relatórios exportáveis (CSV/PDF em fase posterior).
- Filtros por período, técnico, status, categoria e forma de pagamento.

---

## 5) Ordem Ideal de Desenvolvimento

## Fase 0 — Preparação do projeto
1. Setup Next.js + TypeScript + Tailwind + Prisma + PostgreSQL.
2. Configuração de ambiente (`.env`, prisma client, lint/format).
3. Estrutura base de pastas por domínio.

## Fase 1 — Fundamentos de segurança e base de dados
1. Implementar autenticação (login/logout/sessão).
2. Implementar RBAC (middleware + guards de rota/API).
3. Criar schema Prisma inicial e migrations:
   - usuários/perfis
   - clientes/aparelhos
   - catálogo de serviços/produtos

## Fase 2 — Cadastros principais
1. CRUD de clientes.
2. CRUD de aparelhos.
3. CRUD de serviços e produtos.
4. Validações e componentes reutilizáveis de formulário/tabela.

## Fase 3 — Ordem de serviço (núcleo operacional)
1. Fluxo de criação e edição de OS.
2. Atribuição de técnico e gestão de status.
3. Itens da OS (serviço/peças) e cálculo financeiro.
4. Histórico de status/timeline.

## Fase 4 — Estoque integrado
1. Movimentações de entrada/saída/ajuste.
2. Integração de saída de peças ao fechar/avançar OS.
3. Alertas de estoque mínimo.

## Fase 5 — Caixa de vendas
1. Abertura/fechamento de caixa.
2. Registro de entradas/saídas.
3. Integração com recebimento de OS e vendas avulsas.

## Fase 6 — Financeiro geral
1. Receitas/despesas e categorias.
2. Contas a pagar/receber.
3. Fluxo de caixa e visão consolidada.
4. Indicadores de lucro, faturamento e despesas.

## Fase 7 — Relatórios e dashboard
1. KPIs e gráficos principais.
2. Relatórios por módulos com filtros avançados.
3. Otimizações de consulta (índices e agregações).

## Fase 8 — Qualidade e produção
1. Testes (unitários, integração e e2e dos fluxos críticos).
2. Observabilidade (logs e monitoramento).
3. Hardening de segurança e revisão de permissões.
4. Deploy e documentação operacional.

---

## 6) Requisitos não-funcionais e boas práticas recomendadas
- **Performance**: paginação em listagens, índices no banco, cache seletivo de consultas.
- **Escalabilidade**: arquitetura por módulos + serviços reutilizáveis.
- **Confiabilidade**: transações no Prisma em operações financeiras/estoque.
- **Auditabilidade**: histórico de alterações em OS, estoque e caixa.
- **Usabilidade**: experiência mobile-first com componentes acessíveis.
- **Manutenibilidade**: tipagem forte, validação de dados, padronização de código.

## 7) Entregável desta etapa
Este documento representa o plano técnico completo pré-implementação, cobrindo arquitetura, modelagem de dados, páginas, funcionalidades por módulo e roadmap de desenvolvimento conforme os requisitos de negócio informados.
