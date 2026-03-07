import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { addProduct, getStockReport } from '../store.js';

export function renderProducts(): string {
  const report = getStockReport();

  return appShell('Cadastro de Produtos', `
    <form id="productForm" class="form-grid inline panel">
      <label>Nome<input name="name" /></label>
      <label>Categoria<input name="category" placeholder="Ex.: TELAS" /></label>
      <label>SKU/Código interno<input name="sku" placeholder="Ex.: TL-IP11" /></label>
      <label>Quantidade atual<input name="stockQty" type="number" min="0" /></label>
      <label>Estoque mínimo<input name="minStock" type="number" min="0" /></label>
      <label>Custo de compra<input name="costPrice" type="number" step="0.01" min="0" /></label>
      <label>Preço de venda<input name="salePrice" type="number" step="0.01" min="0.01" /></label>
      <button type="submit">Salvar produto</button>
    </form>

    ${report.products.length === 0 ? emptyState('Nenhum produto cadastrado ainda.') : `
      <table><thead><tr><th>Produto</th><th>Categoria</th><th>SKU</th><th>Qtd</th><th>Mín</th><th>Custo</th><th>Venda</th><th>Lucro estimado</th></tr></thead>
      <tbody>${report.products.map((p) => `<tr><td>${p.name}</td><td>${p.category}</td><td>${p.sku}</td><td>${p.stockQty}</td><td>${p.minStock}</td><td>${toCurrency(p.costPrice)}</td><td>${toCurrency(p.salePrice)}</td><td>${toCurrency(p.estimatedProfit)}</td></tr>`).join('')}</tbody></table>
    `}
  `);
}

export function bindProducts(onDone: () => void): void {
  document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);

    const name = String(fd.get('name') || '');
    const category = String(fd.get('category') || '');
    const sku = String(fd.get('sku') || '');
    const stockQty = Number(fd.get('stockQty') || 0);
    const minStock = Number(fd.get('minStock') || 0);
    const costPrice = Number(fd.get('costPrice') || 0);
    const salePrice = Number(fd.get('salePrice') || 0);

    if (!validateRequired([['Nome', name], ['Categoria', category], ['SKU', sku]])) return;
    if (stockQty < 0 || minStock < 0 || costPrice < 0 || salePrice <= 0) return toast('Valores inválidos no produto.', 'error');

    addProduct({ name, category, sku, stockQty, minStock, costPrice, salePrice });
    toast('Produto cadastrado com sucesso.');
    onDone();
  });
}
