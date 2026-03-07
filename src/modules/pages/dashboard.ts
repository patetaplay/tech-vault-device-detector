import { appShell } from '../../components/ui.js';
import { toCurrency } from '../../core/format.js';
import { getDailyReport, getState } from '../store.js';

export function renderDashboard(): string {
  const state = getState();
  const report = getDailyReport();
  const faturamentoOS = state.orders.filter((o) => o.status === 'ENTREGUE').reduce((a, b) => a + b.totalValue, 0);
  const osAbertas = state.orders.filter((o) => o.status !== 'ENTREGUE' && o.status !== 'CANCELADA').length;

  return appShell(
    'Dashboard Inicial',
    `<section class="cards">
      <article><h3>Clientes</h3><strong>${state.customers.length}</strong></article>
      <article><h3>OS abertas</h3><strong>${osAbertas}</strong></article>
      <article><h3>Venda balcão (dia)</h3><strong>${toCurrency(report.sold)}</strong></article>
      <article><h3>Despesas (dia)</h3><strong>${toCurrency(report.expenses)}</strong></article>
      <article><h3>Saldo do dia</h3><strong>${toCurrency(report.balance)}</strong></article>
      <article><h3>Faturamento OS</h3><strong>${toCurrency(faturamentoOS)}</strong></article>
    </section>`
  );
}
