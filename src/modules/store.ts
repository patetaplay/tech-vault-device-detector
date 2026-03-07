import {
  AppState,
  CashSession,
  CashTransaction,
  CounterSale,
  CounterSaleItem,
  Customer,
  FinancialCategory,
  FinancialEntry,
  FinancialReport,
  OrderProductItem,
  OrderServiceItem,
  PaymentMethod,
  Product,
  ServiceItem,
  ServiceOrder,
  StockMovement
} from '../types.js';

const KEY = 'tech-vault-mvp-state';

const seed: AppState = {
  users: [
    { id: 'u1', name: 'Admin', email: 'admin@techvault.local', password: '123456', role: 'ADMIN' },
    { id: 'u2', name: 'Ana Técnica', email: 'tecnico@techvault.local', password: '123456', role: 'TECNICO' }
  ],
  customers: [],
  products: [
    { id: 'p1', name: 'Tela iPhone 11', category: 'TELAS', sku: 'TL-IP11', stockQty: 5, minStock: 2, costPrice: 200, salePrice: 350 },
    { id: 'p2', name: 'Bateria Samsung A52', category: 'BATERIAS', sku: 'BT-A52', stockQty: 8, minStock: 3, costPrice: 90, salePrice: 180 }
  ],
  stockMovements: [],
  services: [
    { id: 's1', name: 'Troca de tela', basePrice: 250 },
    { id: 's2', name: 'Troca de bateria', basePrice: 120 }
  ],
  orders: [],
  cashSessions: [],
  cashTransactions: [],
  sales: [],
  financialCategories: [
    { id: 'fc1', name: 'Recebimento OS', type: 'RECEITA' },
    { id: 'fc2', name: 'Venda Balcão', type: 'RECEITA' },
    { id: 'fc3', name: 'Despesas Operacionais', type: 'DESPESA' },
    { id: 'fc4', name: 'Fornecedores', type: 'DESPESA' }
  ],
  financialEntries: []
};

export function getState(): AppState {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    localStorage.setItem(KEY, JSON.stringify(seed));
    return seed;
  }

  const parsed = JSON.parse(raw) as Partial<AppState>;
  return {
    ...seed,
    ...parsed,
    products: (parsed.products || []).map((p: any) => ({
      category: 'GERAL',
      sku: `SKU-${p.id || crypto.randomUUID().slice(0, 6).toUpperCase()}`,
      minStock: 0,
      ...p
    })),
    stockMovements: parsed.stockMovements || [],
    cashSessions: parsed.cashSessions || [],
    cashTransactions: parsed.cashTransactions || ((parsed as any).cashEntries ?? []),
    sales: (parsed.sales || []).map((s: any) => ({
      ...s,
      items: (s.items || []).map((i: any) => ({ unitCost: i.unitCost ?? 0, ...i }))
    })),
    financialCategories: parsed.financialCategories || seed.financialCategories,
    financialEntries: parsed.financialEntries || []
  };
}

function saveState(state: AppState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function nowIso(): string {
  return new Date().toISOString();
}

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function todayKey(): string {
  return dateKey(nowIso());
}

function nextOsNumber(orders: ServiceOrder[]): number {
  return orders.reduce((acc, item) => Math.max(acc, item.osNumber || 0), 0) + 1;
}

function calcTotal(services: OrderServiceItem[], products: OrderProductItem[]): number {
  return services.reduce((acc, item) => acc + item.unitPrice, 0) + products.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
}

function registerStockMovement(state: AppState, movement: Omit<StockMovement, 'id' | 'createdAt'>): void {
  state.stockMovements.push({ id: crypto.randomUUID(), createdAt: nowIso(), ...movement });
}

function applyStockDelta(
  state: AppState,
  input: { productId: string; delta: number; reason: string; referenceType: 'MANUAL' | 'OS' | 'VENDA_BALCAO'; referenceId?: string }
): { ok: boolean; message: string } {
  const product = state.products.find((item) => item.id === input.productId);
  if (!product) return { ok: false, message: 'Produto não encontrado.' };

  const nextQty = product.stockQty + input.delta;
  if (nextQty < 0) return { ok: false, message: `Estoque insuficiente para ${product.name}.` };

  product.stockQty = nextQty;
  registerStockMovement(state, {
    productId: product.id,
    productName: product.name,
    type: input.delta > 0 ? 'ENTRADA' : input.delta < 0 ? 'SAIDA' : 'AJUSTE',
    quantity: Math.abs(input.delta),
    reason: input.reason,
    referenceType: input.referenceType,
    referenceId: input.referenceId
  });

  return { ok: true, message: 'Movimentação de estoque registrada.' };
}

function getOpenCashSession(state: AppState): CashSession | undefined {
  return state.cashSessions.find((item) => item.status === 'ABERTO');
}

function registerCashTransactionInternal(state: AppState, input: Omit<CashTransaction, 'id' | 'createdAt' | 'sessionId'>): { ok: boolean; message: string } {
  const session = getOpenCashSession(state);
  if (!session) return { ok: false, message: 'Abra o caixa antes de registrar movimentações.' };
  if (input.type === 'SAIDA' && !input.category.trim()) return { ok: false, message: 'Categoria é obrigatória para saída financeira.' };

  state.cashTransactions.push({
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    sessionId: session.id,
    ...input
  });

  return { ok: true, message: 'Movimentação registrada.' };
}

function addFinancialEntryInternal(state: AppState, entry: Omit<FinancialEntry, 'id' | 'createdAt'>): FinancialEntry {
  const created: FinancialEntry = { id: crypto.randomUUID(), createdAt: nowIso(), ...entry };
  state.financialEntries.push(created);
  return created;
}

export function authenticate(email: string, password: string) {
  return getState().users.find((u) => u.email === email && u.password === password);
}

export function addCustomer(input: Omit<Customer, 'id'>): void {
  const state = getState();
  state.customers.push({ id: crypto.randomUUID(), ...input });
  saveState(state);
}

export function addProduct(input: Omit<Product, 'id'>): void {
  const state = getState();
  const created: Product = { id: crypto.randomUUID(), ...input };
  state.products.push(created);

  if (input.stockQty > 0) {
    registerStockMovement(state, {
      productId: created.id,
      productName: created.name,
      type: 'ENTRADA',
      quantity: input.stockQty,
      reason: 'Estoque inicial de cadastro',
      referenceType: 'MANUAL'
    });
  }

  saveState(state);
}

export function addService(input: Omit<ServiceItem, 'id'>): void {
  const state = getState();
  state.services.push({ id: crypto.randomUUID(), ...input });
  saveState(state);
}

export function getStockReport(filters?: { category?: string; lowOnly?: boolean }) {
  const state = getState();
  const category = filters?.category || '';
  const lowOnly = Boolean(filters?.lowOnly);

  const products = state.products
    .filter((p) => !category || p.category === category)
    .filter((p) => !lowOnly || p.stockQty <= p.minStock)
    .map((p) => ({ ...p, estimatedProfit: (p.salePrice - p.costPrice) * p.stockQty, isLowStock: p.stockQty <= p.minStock }));

  return {
    products,
    categories: Array.from(new Set(state.products.map((p) => p.category))).sort(),
    lowStockCount: state.products.filter((p) => p.stockQty <= p.minStock).length
  };
}

export function getProductStockHistory(productId: string): StockMovement[] {
  return getState().stockMovements.filter((m) => m.productId === productId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function registerStockManualMovement(input: { productId: string; type: 'ENTRADA' | 'SAIDA'; quantity: number; reason: string }): { ok: boolean; message: string } {
  const state = getState();
  if (input.quantity <= 0) return { ok: false, message: 'Quantidade inválida.' };
  if (!input.reason.trim()) return { ok: false, message: 'Justificativa obrigatória.' };

  const delta = input.type === 'ENTRADA' ? input.quantity : -input.quantity;
  const result = applyStockDelta(state, { productId: input.productId, delta, reason: input.reason, referenceType: 'MANUAL' });
  if (!result.ok) return result;

  saveState(state);
  return { ok: true, message: 'Movimentação registrada com sucesso.' };
}

export function registerStockAdjustment(input: { productId: string; newQuantity: number; reason: string }): { ok: boolean; message: string } {
  const state = getState();
  const product = state.products.find((p) => p.id === input.productId);
  if (!product) return { ok: false, message: 'Produto não encontrado.' };
  if (input.newQuantity < 0) return { ok: false, message: 'Quantidade não pode ser negativa.' };
  if (!input.reason.trim()) return { ok: false, message: 'Justificativa obrigatória.' };

  const delta = input.newQuantity - product.stockQty;
  const result = applyStockDelta(state, { productId: product.id, delta, reason: `Ajuste manual: ${input.reason}`, referenceType: 'MANUAL' });
  if (!result.ok) return result;

  saveState(state);
  return { ok: true, message: 'Ajuste de estoque aplicado.' };
}

export function addOrder(input: Omit<ServiceOrder, 'id' | 'osNumber' | 'openedAt' | 'updatedAt' | 'history' | 'totalValue'>): ServiceOrder {
  const state = getState();
  const timestamp = nowIso();
  const order: ServiceOrder = {
    ...input,
    id: crypto.randomUUID(),
    osNumber: nextOsNumber(state.orders),
    totalValue: calcTotal(input.services, input.products),
    openedAt: timestamp,
    updatedAt: timestamp,
    history: [{ id: crypto.randomUUID(), date: timestamp, type: 'CRIACAO', description: 'OS criada.' }]
  };
  state.orders.push(order);
  saveState(state);
  return order;
}

export function updateOrder(orderId: string, patch: Partial<Pick<ServiceOrder, 'model' | 'imei' | 'defect' | 'technician' | 'passwordPattern' | 'entryState' | 'estimatedDelivery' | 'services' | 'products' | 'paymentOnDelivery' | 'paymentMethod'>>): { ok: boolean; message: string } {
  const state = getState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, message: 'OS não encontrada.' };
  if (order.status === 'ENTREGUE' || order.status === 'CANCELADA') return { ok: false, message: 'Não é possível editar uma OS entregue/cancelada.' };

  Object.assign(order, patch);
  order.totalValue = calcTotal(order.services, order.products);
  order.updatedAt = nowIso();
  order.history.push({ id: crypto.randomUUID(), date: order.updatedAt, type: 'EDICAO', description: 'Dados da OS atualizados.' });

  saveState(state);
  return { ok: true, message: 'OS atualizada com sucesso.' };
}

export function addOrderTechnicalNote(orderId: string, note: string): { ok: boolean; message: string } {
  const state = getState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, message: 'OS não encontrada.' };
  if (!note.trim()) return { ok: false, message: 'Observação inválida.' };

  order.technicalNotes.push(note.trim());
  order.updatedAt = nowIso();
  order.history.push({ id: crypto.randomUUID(), date: order.updatedAt, type: 'OBSERVACAO', description: `Observação adicionada: ${note.trim()}` });

  saveState(state);
  return { ok: true, message: 'Observação técnica adicionada.' };
}

export function changeOrderStatus(orderId: string, status: ServiceOrder['status']): { ok: boolean; message: string } {
  const state = getState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, message: 'OS não encontrada.' };
  if (order.status === 'ENTREGUE' || order.status === 'CANCELADA') return { ok: false, message: 'OS já finalizada.' };

  order.status = status;
  order.updatedAt = nowIso();
  order.history.push({ id: crypto.randomUUID(), date: order.updatedAt, type: status === 'CANCELADA' ? 'CANCELAMENTO' : 'STATUS', description: `Status alterado para ${status}.` });

  saveState(state);
  return { ok: true, message: 'Status alterado com sucesso.' };
}

export function openCashSession(openingAmount: number, openedBy = 'Sistema'): { ok: boolean; message: string } {
  const state = getState();
  if (getOpenCashSession(state)) return { ok: false, message: 'Já existe um caixa aberto.' };
  if (openingAmount < 0) return { ok: false, message: 'Valor de abertura inválido.' };

  state.cashSessions.push({ id: crypto.randomUUID(), openedAt: nowIso(), openedBy, openingAmount, status: 'ABERTO' });
  saveState(state);
  return { ok: true, message: 'Caixa aberto com sucesso.' };
}

export function closeCashSession(closingAmount: number): { ok: boolean; message: string } {
  const state = getState();
  const session = getOpenCashSession(state);
  if (!session) return { ok: false, message: 'Não há caixa aberto.' };

  const tx = state.cashTransactions.filter((item) => item.sessionId === session.id);
  const entries = tx.filter((item) => item.type === 'ENTRADA').reduce((acc, item) => acc + item.amount, 0);
  const exits = tx.filter((item) => item.type === 'SAIDA').reduce((acc, item) => acc + item.amount, 0);

  session.status = 'FECHADO';
  session.closedAt = nowIso();
  session.expectedAmount = session.openingAmount + entries - exits;
  session.closingAmount = closingAmount;

  saveState(state);
  return { ok: true, message: 'Caixa fechado com sucesso.' };
}

export function addCashEntry(input: { type: 'ENTRADA' | 'SAIDA'; category: string; description: string; amount: number; paymentMethod: PaymentMethod }): { ok: boolean; message: string } {
  const state = getState();
  if (input.amount <= 0) return { ok: false, message: 'Valor inválido.' };

  const txResult = registerCashTransactionInternal(state, input);
  if (!txResult.ok) return txResult;

  saveState(state);
  return { ok: true, message: 'Movimentação lançada com sucesso.' };
}

export function createCounterSale(input: { productId: string; quantity: number; paymentMethod: PaymentMethod }): { ok: boolean; message: string } {
  const state = getState();
  const session = getOpenCashSession(state);
  if (!session) return { ok: false, message: 'Abra o caixa para vender no balcão.' };

  const product = state.products.find((item) => item.id === input.productId);
  if (!product) return { ok: false, message: 'Produto não encontrado.' };
  if (input.quantity <= 0) return { ok: false, message: 'Quantidade inválida.' };

  const stockResult = applyStockDelta(state, {
    productId: product.id,
    delta: -input.quantity,
    reason: `Venda balcão: ${product.name} x${input.quantity}`,
    referenceType: 'VENDA_BALCAO'
  });
  if (!stockResult.ok) return stockResult;

  const item: CounterSaleItem = {
    productId: product.id,
    productName: product.name,
    quantity: input.quantity,
    unitPrice: product.salePrice,
    unitCost: product.costPrice,
    total: input.quantity * product.salePrice
  };

  const sale: CounterSale = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    items: [item],
    paymentMethod: input.paymentMethod,
    total: item.total,
    createdAt: nowIso()
  };

  state.sales.push(sale);

  const txResult = registerCashTransactionInternal(state, {
    type: 'ENTRADA',
    category: 'VENDA_BALCAO',
    description: `Venda balcão: ${product.name} x${input.quantity}`,
    amount: sale.total,
    paymentMethod: input.paymentMethod
  });
  if (!txResult.ok) return txResult;

  state.stockMovements[state.stockMovements.length - 1].referenceId = sale.id;
  saveState(state);
  return { ok: true, message: 'Venda registrada com sucesso.' };
}

export function deliverOrder(orderId: string): { ok: boolean; message: string } {
  const state = getState();
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return { ok: false, message: 'OS não encontrada.' };
  if (order.status === 'ENTREGUE') return { ok: false, message: 'OS já entregue.' };
  if (order.status === 'CANCELADA') return { ok: false, message: 'OS cancelada.' };

  for (const used of order.products) {
    const result = applyStockDelta(state, {
      productId: used.productId,
      delta: -used.quantity,
      reason: `Consumo na OS #${order.osNumber}`,
      referenceType: 'OS',
      referenceId: order.id
    });
    if (!result.ok) return result;
  }

  order.status = 'ENTREGUE';
  order.deliveredAt = nowIso();
  order.updatedAt = order.deliveredAt;
  order.history.push({ id: crypto.randomUUID(), date: order.deliveredAt, type: 'ENTREGA', description: 'OS entregue e estoque baixado.' });

  if (order.paymentOnDelivery) {
    const txResult = registerCashTransactionInternal(state, {
      type: 'ENTRADA',
      category: 'RECEBIMENTO_OS',
      description: `Recebimento OS #${order.osNumber}`,
      amount: order.totalValue,
      paymentMethod: order.paymentMethod
    });
    if (!txResult.ok) return txResult;

    addFinancialEntryInternal(state, {
      type: 'RECEBER',
      categoryId: 'fc1',
      categoryName: 'Recebimento OS',
      description: `OS #${order.osNumber}`,
      amount: order.totalValue,
      dueDate: dateKey(order.deliveredAt),
      status: 'PAGO',
      paidAt: order.deliveredAt,
      paymentMethod: order.paymentMethod,
      referenceType: 'OS',
      referenceId: order.id
    });
  } else {
    addFinancialEntryInternal(state, {
      type: 'RECEBER',
      categoryId: 'fc1',
      categoryName: 'Recebimento OS',
      description: `OS #${order.osNumber}`,
      amount: order.totalValue,
      dueDate: dateKey(order.deliveredAt),
      status: 'ABERTO',
      referenceType: 'OS',
      referenceId: order.id
    });
  }

  saveState(state);
  return { ok: true, message: 'OS entregue com sucesso.' };
}

export function getDailyReport(date = todayKey()) {
  const state = getState();
  const sessionsToday = state.cashSessions.filter((item) => dateKey(item.openedAt) === date || (item.closedAt && dateKey(item.closedAt) === date));
  const sessionIds = new Set(sessionsToday.map((item) => item.id));

  const transactions = state.cashTransactions.filter((item) => dateKey(item.createdAt) === date || sessionIds.has(item.sessionId));
  const sales = state.sales.filter((item) => dateKey(item.createdAt) === date || sessionIds.has(item.sessionId));

  const sold = sales.reduce((acc, item) => acc + item.total, 0);
  const expenses = transactions.filter((item) => item.type === 'SAIDA').reduce((acc, item) => acc + item.amount, 0);
  const entries = transactions.filter((item) => item.type === 'ENTRADA').reduce((acc, item) => acc + item.amount, 0);

  return { date, sessionsToday, transactions, sales, sold, expenses, balance: entries - expenses };
}

export function getCurrentCashSession() {
  return getOpenCashSession(getState()) || null;
}

export function addFinancialCategory(input: Omit<FinancialCategory, 'id'>): { ok: boolean; message: string } {
  const state = getState();
  if (!input.name.trim()) return { ok: false, message: 'Nome da categoria é obrigatório.' };

  state.financialCategories.push({ id: crypto.randomUUID(), ...input });
  saveState(state);
  return { ok: true, message: 'Categoria financeira criada.' };
}

export function addFinancialEntry(input: Omit<FinancialEntry, 'id' | 'createdAt' | 'status'>): { ok: boolean; message: string } {
  const state = getState();
  if (input.amount <= 0) return { ok: false, message: 'Valor inválido.' };

  addFinancialEntryInternal(state, {
    ...input,
    status: 'ABERTO'
  });

  saveState(state);
  return { ok: true, message: 'Lançamento financeiro criado.' };
}

export function settleFinancialEntry(entryId: string, paymentMethod: PaymentMethod): { ok: boolean; message: string } {
  const state = getState();
  const entry = state.financialEntries.find((item) => item.id === entryId);
  if (!entry) return { ok: false, message: 'Lançamento não encontrado.' };
  if (entry.status === 'PAGO') return { ok: false, message: 'Lançamento já liquidado.' };

  entry.status = 'PAGO';
  entry.paidAt = nowIso();
  entry.paymentMethod = paymentMethod;

  const type = entry.type === 'RECEBER' ? 'ENTRADA' : 'SAIDA';
  const txResult = registerCashTransactionInternal(state, {
    type,
    category: entry.categoryName,
    description: `Liquidação ${entry.type.toLowerCase()}: ${entry.description}`,
    amount: entry.amount,
    paymentMethod
  });
  if (!txResult.ok) return txResult;

  saveState(state);
  return { ok: true, message: 'Lançamento liquidado com sucesso.' };
}

export function getFinancialReport(from: string, to: string): FinancialReport {
  const state = getState();
  const fromDate = new Date(`${from}T00:00:00.000Z`).getTime();
  const toDate = new Date(`${to}T23:59:59.999Z`).getTime();

  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= fromDate && t <= toDate;
  };

  let totalFaturado = 0;
  let totalRecebido = 0;
  let totalEmAberto = 0;
  let totalDespesas = 0;
  let lucroBruto = 0;
  let lucroLiquido = 0;
  let quantidadeOS = 0;
  let quantidadeVendas = 0;

  const fluxoByDay = new Map<string, { entradas: number; saidas: number }>();
  const faturamentoMensalMap = new Map<string, number>();
  const despesasMensaisMap = new Map<string, number>();
  const lucroPorOS: Array<{ osNumber: number; receita: number; custoPecas: number; lucro: number }> = [];
  const lucroPorVenda: Array<{ saleId: string; receita: number; custo: number; lucro: number }> = [];

  for (const order of state.orders) {
    if (!order.deliveredAt || !inRange(order.deliveredAt)) continue;

    quantidadeOS += 1;
    const receita = order.totalValue;
    const custoPecas = order.products.reduce((acc, p) => {
      const prod = state.products.find((x) => x.id === p.productId);
      return acc + (prod ? prod.costPrice : 0) * p.quantity;
    }, 0);
    const lucro = receita - custoPecas;

    totalFaturado += receita;
    lucroBruto += lucro;

    const m = monthKey(order.deliveredAt);
    faturamentoMensalMap.set(m, (faturamentoMensalMap.get(m) || 0) + receita);

    lucroPorOS.push({ osNumber: order.osNumber, receita, custoPecas, lucro });
  }

  for (const sale of state.sales) {
    if (!inRange(sale.createdAt)) continue;

    quantidadeVendas += 1;
    const receita = sale.total;
    const custo = sale.items.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
    const lucro = receita - custo;

    totalFaturado += receita;
    lucroBruto += lucro;

    const m = monthKey(sale.createdAt);
    faturamentoMensalMap.set(m, (faturamentoMensalMap.get(m) || 0) + receita);

    lucroPorVenda.push({ saleId: sale.id, receita, custo, lucro });
  }

  for (const entry of state.financialEntries) {
    const dueIso = `${entry.dueDate}T00:00:00.000Z`;
    const dueInRange = inRange(dueIso);

    if (entry.type === 'RECEBER' && dueInRange && entry.status === 'ABERTO') {
      totalEmAberto += entry.amount;
    }

    if (entry.status === 'PAGO' && entry.paidAt && inRange(entry.paidAt)) {
      if (entry.type === 'RECEBER') {
        totalRecebido += entry.amount;
      } else {
        totalDespesas += entry.amount;
        const m = monthKey(entry.paidAt);
        despesasMensaisMap.set(m, (despesasMensaisMap.get(m) || 0) + entry.amount);
      }
    }
  }

  for (const tx of state.cashTransactions) {
    if (!inRange(tx.createdAt)) continue;

    const d = dateKey(tx.createdAt);
    const prev = fluxoByDay.get(d) || { entradas: 0, saidas: 0 };
    if (tx.type === 'ENTRADA') prev.entradas += tx.amount;
    else prev.saidas += tx.amount;
    fluxoByDay.set(d, prev);

    if (tx.type === 'SAIDA') {
      const m = monthKey(tx.createdAt);
      despesasMensaisMap.set(m, (despesasMensaisMap.get(m) || 0) + tx.amount);
      totalDespesas += tx.amount;
    }

    if (tx.type === 'ENTRADA') totalRecebido += tx.amount;
  }

  lucroLiquido = lucroBruto - totalDespesas;

  const fluxoCaixa = Array.from(fluxoByDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, entradas: v.entradas, saidas: v.saidas, saldo: v.entradas - v.saidas }));

  const faturamentoMensal = Array.from(faturamentoMensalMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));

  const despesasMensais = Array.from(despesasMensaisMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total }));

  const ticketMedio = quantidadeOS + quantidadeVendas > 0 ? totalFaturado / (quantidadeOS + quantidadeVendas) : 0;

  return {
    from,
    to,
    kpis: {
      totalFaturado,
      totalRecebido,
      totalEmAberto,
      totalDespesas,
      lucroBruto,
      lucroLiquido,
      quantidadeOS,
      quantidadeVendas,
      ticketMedio
    },
    fluxoCaixa,
    faturamentoMensal,
    despesasMensais,
    lucroPorOS,
    lucroPorVenda
  };
}

export function resetState() {
  localStorage.setItem(KEY, JSON.stringify(seed));
}
