import { addCashEntry, closeCashSession, getCurrentCashSession, getDailyReport, openCashSession } from '../store.js';
export function openCashRoute(payload) {
    return openCashSession(payload.openingAmount, payload.openedBy || 'Operador');
}
export function closeCashRoute(payload) {
    return closeCashSession(payload.closingAmount);
}
export function transactionRoute(payload) {
    return addCashEntry(payload);
}
export function currentCashRoute() {
    return getCurrentCashSession();
}
export function dailyCashReportRoute(date) {
    return getDailyReport(date);
}
