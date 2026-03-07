import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { createAccountsPayableRoute, createAccountsReceivableRoute, createFinancialCategoryRoute, financialReportRoute, listFinancialCategoriesRoute, listFinancialEntriesRoute, settleFinancialEntryRoute } from '../api/financeApi.js';
const PAYMENT_OPTIONS = ['DINHEIRO', 'PIX', 'CARTAO', 'BOLETO'];
function today() {
    return new Date().toISOString().slice(0, 10);
}
function monthStart() {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
}
function renderKpiCards(report) {
    const k = report.kpis;
    return `
  <section class="cards">
    <article><h3>Total faturado</h3><strong>${toCurrency(k.totalFaturado)}</strong></article>
    <article><h3>Total recebido</h3><strong>${toCurrency(k.totalRecebido)}</strong></article>
    <article><h3>Total em aberto</h3><strong>${toCurrency(k.totalEmAberto)}</strong></article>
    <article><h3>Total de despesas</h3><strong>${toCurrency(k.totalDespesas)}</strong></article>
    <article><h3>Lucro bruto</h3><strong>${toCurrency(k.lucroBruto)}</strong></article>
    <article><h3>Lucro líquido</h3><strong>${toCurrency(k.lucroLiquido)}</strong></article>
    <article><h3>Quantidade de OS</h3><strong>${k.quantidadeOS}</strong></article>
    <article><h3>Quantidade de vendas</h3><strong>${k.quantidadeVendas}</strong></article>
    <article><h3>Ticket médio</h3><strong>${toCurrency(k.ticketMedio)}</strong></article>
  </section>`;
}
function renderReportTables(report) {
    return `
    <div class="grid-two">
      <section class="panel">
        <h3>Faturamento mensal</h3>
        ${report.faturamentoMensal.length === 0 ? emptyState('Sem dados.') : `
          <table><thead><tr><th>Mês</th><th>Total</th></tr></thead><tbody>
          ${report.faturamentoMensal.map((r) => `<tr><td>${r.month}</td><td>${toCurrency(r.total)}</td></tr>`).join('')}
          </tbody></table>
        `}
      </section>
      <section class="panel">
        <h3>Despesas mensais</h3>
        ${report.despesasMensais.length === 0 ? emptyState('Sem dados.') : `
          <table><thead><tr><th>Mês</th><th>Total</th></tr></thead><tbody>
          ${report.despesasMensais.map((r) => `<tr><td>${r.month}</td><td>${toCurrency(r.total)}</td></tr>`).join('')}
          </tbody></table>
        `}
      </section>
    </div>

    <section class="panel">
      <h3>Fluxo de caixa por dia</h3>
      ${report.fluxoCaixa.length === 0 ? emptyState('Sem dados.') : `
        <table><thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead><tbody>
        ${report.fluxoCaixa.map((r) => `<tr><td>${r.date}</td><td>${toCurrency(r.entradas)}</td><td>${toCurrency(r.saidas)}</td><td>${toCurrency(r.saldo)}</td></tr>`).join('')}
        </tbody></table>
      `}
    </section>

    <div class="grid-two">
      <section class="panel">
        <h3>Lucro por OS</h3>
        ${report.lucroPorOS.length === 0 ? emptyState('Sem OS no período.') : `
          <table><thead><tr><th>OS</th><th>Receita</th><th>Custo peças</th><th>Lucro</th></tr></thead><tbody>
          ${report.lucroPorOS.map((r) => `<tr><td>#${r.osNumber}</td><td>${toCurrency(r.receita)}</td><td>${toCurrency(r.custoPecas)}</td><td>${toCurrency(r.lucro)}</td></tr>`).join('')}
          </tbody></table>
        `}
      </section>
      <section class="panel">
        <h3>Lucro por venda</h3>
        ${report.lucroPorVenda.length === 0 ? emptyState('Sem vendas no período.') : `
          <table><thead><tr><th>Venda</th><th>Receita</th><th>Custo</th><th>Lucro</th></tr></thead><tbody>
          ${report.lucroPorVenda.map((r) => `<tr><td>${r.saleId.slice(0, 6)}</td><td>${toCurrency(r.receita)}</td><td>${toCurrency(r.custo)}</td><td>${toCurrency(r.lucro)}</td></tr>`).join('')}
          </tbody></table>
        `}
      </section>
    </div>
  `;
}
function renderEntriesTables() {
    const entries = listFinancialEntriesRoute();
    const payable = entries.filter((e) => e.type === 'PAGAR');
    const receivable = entries.filter((e) => e.type === 'RECEBER');
    const table = (rows, kind) => rows.length === 0
        ? emptyState(`Sem contas a ${kind === 'PAGAR' ? 'pagar' : 'receber'}.`)
        : `<table><thead><tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ação</th></tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td>${r.description}</td><td>${r.categoryName}</td><td>${toCurrency(r.amount)}</td><td>${r.dueDate}</td><td>${r.status}</td>
          <td>${r.status === 'ABERTO' ? `<button data-settle-id="${r.id}">Liquidar</button>` : '-'}</td>
        </tr>`).join('')}
      </tbody></table>`;
    return `
    <div class="grid-two">
      <section class="panel"><h3>Contas a pagar</h3>${table(payable, 'PAGAR')}</section>
      <section class="panel"><h3>Contas a receber</h3>${table(receivable, 'RECEBER')}</section>
    </div>
  `;
}
export function renderFinance() {
    const from = monthStart();
    const to = today();
    const report = financialReportRoute({ from, to });
    const categories = listFinancialCategoriesRoute();
    return appShell('Financeiro', `
    <form id="financePeriodForm" class="form-grid inline panel">
      <label>De<input type="date" name="from" value="${from}" /></label>
      <label>Até<input type="date" name="to" value="${to}" /></label>
      <button type="submit">Atualizar relatório</button>
    </form>

    <section id="financeKpis">${renderKpiCards(report)}</section>
    <section id="financeTables">${renderReportTables(report)}</section>

    <form id="categoryForm" class="form-grid inline panel">
      <h3>Categorias financeiras</h3>
      <label>Nome<input name="name" /></label>
      <label>Tipo<select name="type"><option value="RECEITA">Receita</option><option value="DESPESA">Despesa</option><option value="AMBOS">Ambos</option></select></label>
      <button type="submit">Criar categoria</button>
    </form>

    <div class="grid-two">
      <form id="payableForm" class="form-grid panel">
        <h3>Novo contas a pagar</h3>
        <label>Categoria<select name="categoryId">${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
        <label>Descrição<input name="description" /></label>
        <label>Valor<input type="number" step="0.01" min="0.01" name="amount" /></label>
        <label>Vencimento<input type="date" name="dueDate" value="${to}" /></label>
        <button type="submit">Adicionar</button>
      </form>

      <form id="receivableForm" class="form-grid panel">
        <h3>Novo contas a receber</h3>
        <label>Categoria<select name="categoryId">${categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select></label>
        <label>Descrição<input name="description" /></label>
        <label>Valor<input type="number" step="0.01" min="0.01" name="amount" /></label>
        <label>Vencimento<input type="date" name="dueDate" value="${to}" /></label>
        <button type="submit">Adicionar</button>
      </form>
    </div>

    <section id="financeEntries">${renderEntriesTables()}</section>
  `);
}
export function bindFinance(onDone) {
    document.getElementById('financePeriodForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const from = String(fd.get('from') || monthStart());
        const to = String(fd.get('to') || today());
        const report = financialReportRoute({ from, to });
        const kpiEl = document.getElementById('financeKpis');
        const tableEl = document.getElementById('financeTables');
        if (kpiEl)
            kpiEl.innerHTML = renderKpiCards(report);
        if (tableEl)
            tableEl.innerHTML = renderReportTables(report);
    });
    document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = String(fd.get('name') || '');
        const type = String(fd.get('type') || 'AMBOS');
        if (!validateRequired([['Nome da categoria', name]]))
            return;
        const result = createFinancialCategoryRoute({ name, type });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    });
    function submitEntry(kind, form) {
        const fd = new FormData(form);
        const categoryId = String(fd.get('categoryId') || '');
        const description = String(fd.get('description') || '');
        const amount = Number(fd.get('amount') || 0);
        const dueDate = String(fd.get('dueDate') || today());
        if (!validateRequired([['Categoria', categoryId], ['Descrição', description], ['Vencimento', dueDate]]))
            return;
        const category = listFinancialCategoriesRoute().find((c) => c.id === categoryId);
        if (!category)
            return toast('Categoria inválida.', 'error');
        const result = kind === 'payable'
            ? createAccountsPayableRoute({ categoryId, categoryName: category.name, description, amount, dueDate })
            : createAccountsReceivableRoute({ categoryId, categoryName: category.name, description, amount, dueDate });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    }
    document.getElementById('payableForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitEntry('payable', e.target);
    });
    document.getElementById('receivableForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitEntry('receivable', e.target);
    });
    document.getElementById('financeEntries')?.addEventListener('click', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLButtonElement))
            return;
        const entryId = target.dataset.settleId;
        if (!entryId)
            return;
        const methodRaw = prompt('Forma de pagamento: DINHEIRO, PIX, CARTAO ou BOLETO', 'PIX');
        if (!methodRaw)
            return;
        const method = methodRaw.toUpperCase();
        if (!PAYMENT_OPTIONS.includes(method))
            return toast('Forma de pagamento inválida.', 'error');
        const result = settleFinancialEntryRoute({ entryId, paymentMethod: method });
        toast(result.message, result.ok ? 'success' : 'error');
        onDone();
    });
}
