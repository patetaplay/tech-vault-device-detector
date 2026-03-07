import { addFinancialCategory, addFinancialEntry, getFinancialReport, getState, settleFinancialEntry } from '../store.js';
export function listFinancialCategoriesRoute() {
    return getState().financialCategories;
}
export function listFinancialEntriesRoute() {
    return getState().financialEntries;
}
export function createFinancialCategoryRoute(payload) {
    return addFinancialCategory(payload);
}
export function createAccountsPayableRoute(payload) {
    return addFinancialEntry({
        type: 'PAGAR',
        categoryId: payload.categoryId,
        categoryName: payload.categoryName,
        description: payload.description,
        amount: payload.amount,
        dueDate: payload.dueDate
    });
}
export function createAccountsReceivableRoute(payload) {
    return addFinancialEntry({
        type: 'RECEBER',
        categoryId: payload.categoryId,
        categoryName: payload.categoryName,
        description: payload.description,
        amount: payload.amount,
        dueDate: payload.dueDate
    });
}
export function settleFinancialEntryRoute(payload) {
    return settleFinancialEntry(payload.entryId, payload.paymentMethod);
}
export function financialReportRoute(payload) {
    return getFinancialReport(payload.from, payload.to);
}
