import { getProductStockHistory, getStockReport, registerStockAdjustment, registerStockManualMovement } from '../store.js';

export function stockReportRoute(filters?: { category?: string; lowOnly?: boolean }) {
  return getStockReport(filters);
}

export function stockHistoryByProductRoute(productId: string) {
  return getProductStockHistory(productId);
}

export function stockMoveRoute(payload: { productId: string; type: 'ENTRADA' | 'SAIDA'; quantity: number; reason: string }) {
  return registerStockManualMovement(payload);
}

export function stockAdjustRoute(payload: { productId: string; newQuantity: number; reason: string }) {
  return registerStockAdjustment(payload);
}
