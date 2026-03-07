import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency, toDateTime } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { closeCashRoute, currentCashRoute, dailyCashReportRoute, openCashRoute, transactionRoute } from '../api/cashApi.js';
const PAYMENT_OPTIONS = ['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO'];
const OUT_CATEGORIES = ['DESPESA_GERAL', 'FORNECEDOR', 'MANUTENCAO', 'RETIRADA', 'OUTROS'];
const IN_CATEGORIES = ['APORTE', 'RECEBIMENTO', 'AJUSTE', 'OUTROS'];
export function renderCash() {
    const session = currentCashRoute();
    const report = dailyCashReportRoute();
    return appShell('Caixa Diário', `
    <section class="cards">
      <article><h3>Status do caixa</h3><strong>${session ? 'ABERTO' : 'FECHADO'}</strong></article>
      <article><h3>Total vendido no dia</h3><strong>${toCurrency(report.sold)}</strong></article>
      <article><h3>Despesas do dia</h3><strong>${toCurrency(report.expenses)}</strong></article>
      <article><h3>Saldo final/parcial</h3><strong>${toCurrency(report.balance)}</strong></article>
    </section>

    <section class="grid-two">
      <form id="openCashForm" class="form-grid panel">
        <h3>Abertura de caixa</h3>
        <label>Valor inicial<input type="number" step="0.01" min="0" name="openingAmount" /></label>
        <button type="submit">Abrir caixa</button>
      </form>

      <form id="closeCashForm" class="form-grid panel">
        <h3>Fechamento de caixa</h3>
        <label>Valor em caixa no fechamento<input type="number" step="0.01" min="0" name="closingAmount" /></label>
        <button type="submit">Fechar caixa</button>
      </form>
    </section>

    <form id="cashTransactionForm" class="form-grid inline panel">
      <h3>Lançamento financeiro</h3>
      <label>Tipo
        <select name="type">
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA">Saída</option>
        </select>
      </label>
      <label>Categoria
        <select name="category" id="cashCategory">
          ${IN_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </label>
      <label>Forma de pagamento
        <select name="paymentMethod">${PAYMENT_OPTIONS.map((p) => `<option value="${p}">${p}</option>`).join('')}</select>
      </label>
      <label>Descrição<input name="description" /></label>
      <label>Valor<input type="number" min="0.01" step="0.01" name="amount" /></label>
      <button type="submit">Registrar</button>
    </form>

    <h3>Histórico diário</h3>
    ${report.transactions.length === 0 ? emptyState('Sem movimentações financeiras hoje.') : `
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Forma</th><th>Descrição</th><th>Valor</th></tr></thead>
      <tbody>${report.transactions.map((t) => `<tr><td>${toDateTime(t.createdAt)}</td><td>${t.type}</td><td>${t.category}</td><td>${t.paymentMethod}</td><td>${t.description}</td><td>${toCurrency(t.amount)}</td></tr>`).join('')}</tbody></table>
    `}
  `);
}
export function bindCash(onDone) {
    const typeSelect = document.querySelector('#cashTransactionForm select[name="type"]');
    const catSelect = document.getElementById('cashCategory');
    function syncCategories() {
        if (!typeSelect || !catSelect)
            return;
        const options = (typeSelect.value === 'SAIDA' ? OUT_CATEGORIES : IN_CATEGORIES)
            .map((c) => `<option value="${c}">${c}</option>`)
            .join('');
        catSelect.innerHTML = options;
    }
    typeSelect?.addEventListener('change', syncCategories);
    syncCategories();
    document.getElementById('openCashForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const openingAmount = Number(fd.get('openingAmount') || 0);
        const result = openCashRoute({ openingAmount, openedBy: 'Operador Web' });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    });
    document.getElementById('closeCashForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const closingAmount = Number(fd.get('closingAmount') || 0);
        const result = closeCashRoute({ closingAmount });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    });
    document.getElementById('cashTransactionForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const type = String(fd.get('type') || 'ENTRADA');
        const category = String(fd.get('category') || '');
        const paymentMethod = String(fd.get('paymentMethod') || 'DINHEIRO');
        const description = String(fd.get('description') || '');
        const amount = Number(fd.get('amount') || 0);
        if (!validateRequired([['Descrição', description], ['Categoria', category]]))
            return;
        const result = transactionRoute({ type, category, paymentMethod, description, amount });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    });
}
