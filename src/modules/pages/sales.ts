import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency, toDateTime } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { createCounterSaleRoute } from '../api/salesApi.js';
import { dailyCashReportRoute } from '../api/cashApi.js';
import { getState } from '../store.js';

const PAYMENT_OPTIONS = ['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO'] as const;

export function renderSales(): string {
  const state = getState();
  const report = dailyCashReportRoute();
  const productOptions = state.products.map((p) => `<option value="${p.id}">${p.name} (estoque: ${p.stockQty})</option>`).join('');

  return appShell('Vendas no Balcão', `
    <form id="saleForm" class="form-grid inline panel">
      <label>Produto
        <select name="productId"><option value="">Selecione</option>${productOptions}</select>
      </label>
      <label>Quantidade<input name="quantity" type="number" min="1" value="1" /></label>
      <label>Forma de pagamento
        <select name="paymentMethod">${PAYMENT_OPTIONS.map((p) => `<option value="${p}">${p}</option>`).join('')}</select>
      </label>
      <button type="submit">Registrar venda</button>
    </form>

    <section class="cards">
      <article><h3>Total vendido hoje</h3><strong>${toCurrency(report.sold)}</strong></article>
      <article><h3>Qtd. de vendas</h3><strong>${report.sales.length}</strong></article>
    </section>

    <h3>Histórico diário de vendas</h3>
    ${report.sales.length === 0 ? emptyState('Nenhuma venda no balcão hoje.') : `
      <table><thead><tr><th>Data</th><th>Produto</th><th>Qtd</th><th>Forma</th><th>Total</th></tr></thead>
      <tbody>${report.sales.map((sale) => `<tr><td>${toDateTime(sale.createdAt)}</td><td>${sale.items.map((i) => i.productName).join(', ')}</td><td>${sale.items.reduce((a, i) => a + i.quantity, 0)}</td><td>${sale.paymentMethod}</td><td>${toCurrency(sale.total)}</td></tr>`).join('')}</tbody></table>
    `}
  `);
}

export function bindSales(onDone: () => void): void {
  document.getElementById('saleForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const productId = String(fd.get('productId') || '');
    const quantity = Number(fd.get('quantity') || 0);
    const paymentMethod = String(fd.get('paymentMethod') || 'DINHEIRO') as 'DINHEIRO' | 'PIX' | 'CARTAO' | 'BOLETO';

    if (!validateRequired([['Produto', productId]])) return;
    const result = createCounterSaleRoute({ productId, quantity, paymentMethod });
    toast(result.message, result.ok ? 'success' : 'error');
    onDone();
  });
}
