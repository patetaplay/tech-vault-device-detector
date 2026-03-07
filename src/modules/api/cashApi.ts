import { addCashEntry, closeCashSession, getCurrentCashSession, getDailyReport, openCashSession } from '../store.js';
import { PaymentMethod } from '../../types.js';

export function openCashRoute(payload: { openingAmount: number; openedBy?: string }) {
  return openCashSession(payload.openingAmount, payload.openedBy || 'Operador');
}

export function closeCashRoute(payload: { closingAmount: number }) {
  return closeCashSession(payload.closingAmount);
}

export function transactionRoute(payload: {
  type: 'ENTRADA' | 'SAIDA';
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}) {
  return addCashEntry(payload);
}

export function currentCashRoute() {
  return getCurrentCashSession();
}

export function dailyCashReportRoute(date?: string) {
  return getDailyReport(date);
}
