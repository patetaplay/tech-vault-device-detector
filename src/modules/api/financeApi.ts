import { addFinancialCategory, addFinancialEntry, getFinancialReport, getState, settleFinancialEntry } from '../store.js';
import { PaymentMethod } from '../../types.js';

export function listFinancialCategoriesRoute() {
  return getState().financialCategories;
}

export function listFinancialEntriesRoute() {
  return getState().financialEntries;
}

export function createFinancialCategoryRoute(payload: { name: string; type: 'RECEITA' | 'DESPESA' | 'AMBOS' }) {
  return addFinancialCategory(payload);
}

export function createAccountsPayableRoute(payload: { categoryId: string; categoryName: string; description: string; amount: number; dueDate: string }) {
  return addFinancialEntry({
    type: 'PAGAR',
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    description: payload.description,
    amount: payload.amount,
    dueDate: payload.dueDate
  });
}

export function createAccountsReceivableRoute(payload: { categoryId: string; categoryName: string; description: string; amount: number; dueDate: string }) {
  return addFinancialEntry({
    type: 'RECEBER',
    categoryId: payload.categoryId,
    categoryName: payload.categoryName,
    description: payload.description,
    amount: payload.amount,
    dueDate: payload.dueDate
  });
}

export function settleFinancialEntryRoute(payload: { entryId: string; paymentMethod: PaymentMethod }) {
  return settleFinancialEntry(payload.entryId, payload.paymentMethod);
}

export function financialReportRoute(payload: { from: string; to: string }) {
  return getFinancialReport(payload.from, payload.to);
}
