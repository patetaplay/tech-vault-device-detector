import { appShell, emptyState } from '../../components/ui.js';
import { toCurrency } from '../../core/format.js';
import { stockReportRoute } from '../api/stockApi.js';

export function renderStockReport(): string {
  const report = stockReportRoute();
  const totalCost = report.products.reduce((acc, p) => acc + p.costPrice * p.stockQty, 0);
  const totalSale = report.products.reduce((acc, p) => acc + p.salePrice * p.stockQty, 0);
  const estimatedProfit = totalSale - totalCost;

  return appShell('Relatório de Estoque', `
    <section class="cards">
      <article><h3>Total de SKUs</h3><strong>${report.products.length}</strong></article>
      <article><h3>Valor de custo em estoque</h3><strong>${toCurrency(totalCost)}</strong></article>
      <article><h3>Valor de venda em estoque</h3><strong>${toCurrency(totalSale)}</strong></article>
      <article><h3>Lucro estimado em estoque</h3><strong>${toCurrency(estimatedProfit)}</strong></article>
      <article><h3>Itens abaixo do mínimo</h3><strong>${report.lowStockCount}</strong></article>
    </section>

    ${report.products.length === 0 ? emptyState('Sem dados de estoque.') : `
      <table><thead><tr><th>Produto</th><th>Categoria</th><th>SKU</th><th>Qtd</th><th>Mín</th><th>Custo</th><th>Venda</th><th>Lucro estimado</th></tr></thead>
      <tbody>${report.products.map((p) => `<tr><td>${p.name}</td><td>${p.category}</td><td>${p.sku}</td><td>${p.stockQty}</td><td>${p.minStock}</td><td>${toCurrency(p.costPrice)}</td><td>${toCurrency(p.salePrice)}</td><td>${toCurrency(p.estimatedProfit)}</td></tr>`).join('')}</tbody></table>
    `}
  `);
}
