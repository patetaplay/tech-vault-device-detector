export type Role = 'ADMIN' | 'ATENDENTE' | 'TECNICO' | 'CAIXA';
export type PaymentMethod = 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  stockQty: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
  quantity: number;
  reason: string;
  referenceType: 'MANUAL' | 'OS' | 'VENDA_BALCAO';
  referenceId?: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  basePrice: number;
}

export interface OrderProductItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderServiceItem {
  serviceId: string;
  name: string;
  unitPrice: number;
}

export type OsStatus =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'AGUARDANDO_PECA'
  | 'EM_MANUTENCAO'
  | 'PRONTA'
  | 'ENTREGUE'
  | 'CANCELADA';

export interface OsHistoryItem {
  id: string;
  date: string;
  type: 'CRIACAO' | 'EDICAO' | 'STATUS' | 'OBSERVACAO' | 'ENTREGA' | 'CANCELAMENTO';
  description: string;
}

export interface ServiceOrder {
  id: string;
  osNumber: number;
  customerId: string;
  customerName: string;
  model: string;
  imei: string;
  defect: string;
  technician: string;
  passwordPattern: string;
  entryState: string;
  estimatedDelivery: string;
  technicalNotes: string[];
  services: OrderServiceItem[];
  products: OrderProductItem[];
  status: OsStatus;
  totalValue: number;
  paymentOnDelivery: boolean;
  paymentMethod: PaymentMethod;
  openedAt: string;
  updatedAt: string;
  deliveredAt?: string;
  history: OsHistoryItem[];
}

export type CashTransactionType = 'ENTRADA' | 'SAIDA';

export interface CashSession {
  id: string;
  openedAt: string;
  openedBy: string;
  openingAmount: number;
  closedAt?: string;
  closingAmount?: number;
  expectedAmount?: number;
  status: 'ABERTO' | 'FECHADO';
}

export interface CashTransaction {
  id: string;
  sessionId: string;
  type: CashTransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  amount: number;
  createdAt: string;
}

export interface CounterSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  total: number;
}

export interface CounterSale {
  id: string;
  sessionId: string;
  items: CounterSaleItem[];
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'RECEITA' | 'DESPESA' | 'AMBOS';
}

export interface FinancialEntry {
  id: string;
  type: 'PAGAR' | 'RECEBER';
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'ABERTO' | 'PAGO';
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  referenceType?: 'OS' | 'VENDA_BALCAO' | 'MANUAL';
  referenceId?: string;
  createdAt: string;
}

export interface FinancialKpis {
  totalFaturado: number;
  totalRecebido: number;
  totalEmAberto: number;
  totalDespesas: number;
  lucroBruto: number;
  lucroLiquido: number;
  quantidadeOS: number;
  quantidadeVendas: number;
  ticketMedio: number;
}

export interface FinancialReport {
  from: string;
  to: string;
  kpis: FinancialKpis;
  fluxoCaixa: Array<{ date: string; entradas: number; saidas: number; saldo: number }>;
  faturamentoMensal: Array<{ month: string; total: number }>;
  despesasMensais: Array<{ month: string; total: number }>;
  lucroPorOS: Array<{ osNumber: number; receita: number; custoPecas: number; lucro: number }>;
  lucroPorVenda: Array<{ saleId: string; receita: number; custo: number; lucro: number }>;
}

export interface AppState {
  users: User[];
  customers: Customer[];
  products: Product[];
  stockMovements: StockMovement[];
  services: ServiceItem[];
  orders: ServiceOrder[];
  cashSessions: CashSession[];
  cashTransactions: CashTransaction[];
  sales: CounterSale[];
  financialCategories: FinancialCategory[];
  financialEntries: FinancialEntry[];
}
