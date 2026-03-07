import { getProductStockHistory, getStockReport, registerStockAdjustment, registerStockManualMovement } from '../store.js';
export function stockReportRoute(filters) {
    return getStockReport(filters);
}
export function stockHistoryByProductRoute(productId) {
    return getProductStockHistory(productId);
}
export function stockMoveRoute(payload) {
    return registerStockManualMovement(payload);
}
export function stockAdjustRoute(payload) {
    return registerStockAdjustment(payload);
}
