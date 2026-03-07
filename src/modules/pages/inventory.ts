import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency, toDateTime } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { stockAdjustRoute, stockHistoryByProductRoute, stockMoveRoute, stockReportRoute } from '../api/stockApi.js';

export function renderInventory(): string {
  const report = stockReportRoute();
  const productOptions = report.products.map((p) => `<option value="${p.id}">${p.name} (${p.stockQty})</option>`).join('');

  return appShell('Estoque', `
    <section class="cards">
      <article><h3>Produtos cadastrados</h3><strong>${report.products.length}</strong></article>
      <article><h3>Itens com estoque baixo</h3><strong>${report.lowStockCount}</strong></article>
    </section>

    <section class="toolbar">
      <select id="categoryFilter"><option value="">Todas categorias</option>${report.categories.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
      <label><input id="lowOnlyFilter" type="checkbox" /> Somente estoque baixo</label>
    </section>

    <form id="stockMoveForm" class="form-grid inline panel">
      <h3>Movimentação de entrada/saída</h3>
      <label>Produto<select name="productId"><option value="">Selecione</option>${productOptions}</select></label>
      <label>Tipo<select name="type"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select></label>
      <label>Quantidade<input name="quantity" type="number" min="1" value="1" /></label>
      <label>Justificativa<input name="reason" /></label>
      <button type="submit">Registrar movimentação</button>
    </form>

    <form id="stockAdjustForm" class="form-grid inline panel">
      <h3>Ajuste manual de estoque</h3>
      <label>Produto<select name="productId"><option value="">Selecione</option>${productOptions}</select></label>
      <label>Nova quantidade<input name="newQuantity" type="number" min="0" /></label>
      <label>Justificativa<input name="reason" /></label>
      <button type="submit">Aplicar ajuste</button>
    </form>

    <h3>Resumo por produto</h3>
    <table id="inventoryTable"><thead><tr><th>Produto</th><th>Categoria</th><th>SKU</th><th>Qtd</th><th>Mín</th><th>Status</th><th>Lucro estimado</th><th>Histórico</th></tr></thead>
      <tbody>${report.products.map((p) => `<tr>
        <td>${p.name}</td><td>${p.category}</td><td>${p.sku}</td><td>${p.stockQty}</td><td>${p.minStock}</td><td>${p.isLowStock ? 'BAIXO' : 'OK'}</td><td>${toCurrency(p.estimatedProfit)}</td>
        <td><button data-history-product="${p.id}">Ver</button></td>
      </tr>`).join('')}</tbody>
    </table>

    <section id="stockHistoryPanel" class="panel">${emptyState('Selecione um produto para ver histórico.')}</section>
  `);
}

function refreshFilteredTable(): void {
  const category = String((document.getElementById('categoryFilter') as HTMLSelectElement | null)?.value || '');
  const lowOnly = Boolean((document.getElementById('lowOnlyFilter') as HTMLInputElement | null)?.checked);
  const report = stockReportRoute({ category, lowOnly });
  const tbody = document.querySelector('#inventoryTable tbody');
  if (!tbody) return;
  tbody.innerHTML = report.products.map((p) => `<tr>
    <td>${p.name}</td><td>${p.category}</td><td>${p.sku}</td><td>${p.stockQty}</td><td>${p.minStock}</td><td>${p.isLowStock ? 'BAIXO' : 'OK'}</td><td>${toCurrency(p.estimatedProfit)}</td>
    <td><button data-history-product="${p.id}">Ver</button></td>
  </tr>`).join('') || '<tr><td colspan="8">Sem produtos no filtro.</td></tr>';
}

function bindHistoryButtons() {
  document.querySelector('#inventoryTable tbody')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLButtonElement)) return;
    const productId = target.dataset.historyProduct;
    if (!productId) return;

    const history = stockHistoryByProductRoute(productId);
    const panel = document.getElementById('stockHistoryPanel');
    if (!panel) return;

    panel.innerHTML = history.length === 0
      ? emptyState('Sem movimentações para este produto.')
      : `<h3>Histórico do produto</h3><table><thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Motivo</th><th>Origem</th></tr></thead><tbody>
        ${history.map((h) => `<tr><td>${toDateTime(h.createdAt)}</td><td>${h.type}</td><td>${h.quantity}</td><td>${h.reason}</td><td>${h.referenceType}${h.referenceId ? ` (${h.referenceId.slice(0, 6)})` : ''}</td></tr>`).join('')}
      </tbody></table>`;
  });
}

export function bindInventory(onDone: () => void): void {
  document.getElementById('categoryFilter')?.addEventListener('change', refreshFilteredTable);
  document.getElementById('lowOnlyFilter')?.addEventListener('change', refreshFilteredTable);

  document.getElementById('stockMoveForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const productId = String(fd.get('productId') || '');
    const type = String(fd.get('type') || 'ENTRADA') as 'ENTRADA' | 'SAIDA';
    const quantity = Number(fd.get('quantity') || 0);
    const reason = String(fd.get('reason') || '');

    if (!validateRequired([['Produto', productId], ['Justificativa', reason]])) return;
    const result = stockMoveRoute({ productId, type, quantity, reason });
    toast(result.message, result.ok ? 'success' : 'error');
    onDone();
  });

  document.getElementById('stockAdjustForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const productId = String(fd.get('productId') || '');
    const newQuantity = Number(fd.get('newQuantity') || 0);
    const reason = String(fd.get('reason') || '');

    if (!validateRequired([['Produto', productId], ['Justificativa', reason]])) return;
    const result = stockAdjustRoute({ productId, newQuantity, reason });
    toast(result.message, result.ok ? 'success' : 'error');
    onDone();
  });

  bindHistoryButtons();
}
