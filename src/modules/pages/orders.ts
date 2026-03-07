import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency, toDateTime } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { addOrder, addOrderTechnicalNote, changeOrderStatus, deliverOrder, getState, updateOrder } from '../store.js';
import { OrderProductItem, OrderServiceItem, OsStatus, ServiceOrder } from '../../types.js';

const ORDER_STATUS: OsStatus[] = ['ABERTA', 'EM_ANALISE', 'AGUARDANDO_PECA', 'EM_MANUTENCAO', 'PRONTA', 'ENTREGUE', 'CANCELADA'];


function normalizeImei(value: string): string {
  return value.replace(/\D/g, '');
}

function isValidImei(value: string): boolean {
  return /^\d{15}$/.test(normalizeImei(value));
}

function collectServiceItems(serviceIds: string[]): OrderServiceItem[] {
  const state = getState();
  return state.services
    .filter((item) => serviceIds.includes(item.id))
    .map((item) => ({ serviceId: item.id, name: item.name, unitPrice: item.basePrice }));
}

function collectProductItems(productId: string, quantity: number): OrderProductItem[] {
  const state = getState();
  if (!productId) return [];

  const product = state.products.find((item) => item.id === productId);
  if (!product) return [];

  return [{ productId: product.id, name: product.name, quantity, unitPrice: product.salePrice }];
}

function orderRow(order: ServiceOrder): string {
  return `<tr>
    <td>#${order.osNumber}</td>
    <td>${order.customerName}</td>
    <td>${order.model}</td>
    <td>${order.imei || '-'}</td>
    <td>${order.status}</td>
    <td>${toCurrency(order.totalValue)}</td>
    <td class="row-actions">
      <button data-action="edit" data-id="${order.id}">Editar</button>
      <button data-action="status" data-id="${order.id}">Status</button>
      <button data-action="note" data-id="${order.id}">Obs.</button>
      <button data-action="print" data-id="${order.id}">Imprimir</button>
      ${order.status !== 'ENTREGUE' && order.status !== 'CANCELADA' ? `<button data-action="deliver" data-id="${order.id}">Entregar</button>` : ''}
    </td>
  </tr>`;
}

function buildReceipt(order: ServiceOrder): string {
  return `
  <html><head><title>Comprovante OS #${order.osNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { margin: 0 0 10px; }
    .muted { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
  </style></head><body>
    <h1>Comprovante OS #${order.osNumber}</h1>
    <p class="muted">Cliente: ${order.customerName}</p>
    <p class="muted">Modelo: ${order.model} | IMEI: ${order.imei || '-'}</p>
    <p class="muted">Defeito: ${order.defect}</p>
    <p class="muted">Status: ${order.status}</p>
    <p class="muted">Previsão: ${order.estimatedDelivery || '-'}</p>
    <h3>Serviços</h3>
    <table><thead><tr><th>Descrição</th><th>Valor</th></tr></thead><tbody>
      ${order.services.map((item) => `<tr><td>${item.name}</td><td>${toCurrency(item.unitPrice)}</td></tr>`).join('') || '<tr><td colspan="2">Sem serviços.</td></tr>'}
    </tbody></table>
    <h3>Peças</h3>
    <table><thead><tr><th>Peça</th><th>Qtd</th><th>Valor</th></tr></thead><tbody>
      ${order.products.map((item) => `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${toCurrency(item.quantity * item.unitPrice)}</td></tr>`).join('') || '<tr><td colspan="3">Sem peças.</td></tr>'}
    </tbody></table>
    <h2>Total: ${toCurrency(order.totalValue)}</h2>
  </body></html>`;
}

function matchesSearch(order: ServiceOrder, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const qDigits = normalizeImei(query);
  const orderImeiDigits = normalizeImei(order.imei);

  return (
    order.customerName.toLowerCase().includes(q) ||
    order.model.toLowerCase().includes(q) ||
    String(order.osNumber).includes(q) ||
    order.imei.toLowerCase().includes(q) ||
    (qDigits.length > 0 && orderImeiDigits.includes(qDigits))
  );
}

export function renderOrders(): string {
  const state = getState();
  const customerOptions = state.customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
  const serviceOptions = state.services.map((s) => `<label><input type="checkbox" name="serviceIds" value="${s.id}" />${s.name} (${toCurrency(s.basePrice)})</label>`).join('');
  const productOptions = state.products.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');

  return appShell('Ordens de Serviço', `
    <form id="osForm" class="form-grid">
      <input type="hidden" name="orderId" value="" />
      <div class="grid-two">
        <label>Cliente<select name="customerId"><option value="">Selecione</option>${customerOptions}</select></label>
        <label>Técnico<input name="technician" /></label>
      </div>
      <div class="grid-two">
        <label>Modelo<input name="model" placeholder="Ex.: iPhone 11" /></label>
        <label>IMEI<input name="imei" inputmode="numeric" maxlength="15" placeholder="15 dígitos" /></label>
      </div>
      <label>Defeito relatado<input name="defect" /></label>
      <div class="grid-two">
        <label>Senha/Padrão<input name="passwordPattern" placeholder="1234 / desenho" /></label>
        <label>Previsão de entrega<input name="estimatedDelivery" type="date" /></label>
      </div>
      <label>Estado do aparelho na entrada<textarea name="entryState" rows="2"></textarea></label>
      <fieldset><legend>Serviços executados</legend>${serviceOptions || '<p>Cadastre serviços primeiro.</p>'}</fieldset>
      <div class="grid-two">
        <label>Peça usada<select name="productId"><option value="">Nenhuma</option>${productOptions}</select></label>
        <label>Quantidade da peça<input name="quantity" type="number" min="1" value="1" /></label>
      </div>
      <div class="grid-two">
        <label>Pagamento na entrega?
          <select name="paymentOnDelivery">
            <option value="SIM">Sim</option>
            <option value="NAO">Não</option>
          </select>
        </label>
        <label>Forma de pagamento
          <select name="paymentMethod">
            <option value="DINHEIRO">Dinheiro</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO">Cartão</option>
            <option value="BOLETO">Boleto</option>
          </select>
        </label>
      </div>
      <button type="submit">Salvar OS</button>
    </form>

    <section class="toolbar">
      <input id="orderSearch" placeholder="Buscar por cliente, IMEI, modelo ou nº OS" />
      <select id="orderStatusFilter">
        <option value="">Todos os status</option>
        ${ORDER_STATUS.map((status) => `<option value="${status}">${status}</option>`).join('')}
      </select>
    </section>

    <h3>Lista de OS</h3>
    ${state.orders.length === 0 ? emptyState('Nenhuma OS cadastrada ainda.') : `
      <table>
        <thead><tr><th>OS</th><th>Cliente</th><th>Modelo</th><th>IMEI</th><th>Status</th><th>Total</th><th>Ações</th></tr></thead>
        <tbody id="ordersTableBody">
          ${state.orders.map(orderRow).join('')}
        </tbody>
      </table>
    `}

    <section id="orderHistoryPanel" class="panel"></section>
  `);
}

function applyFilters(): void {
  const body = document.getElementById('ordersTableBody');
  if (!body) return;

  const query = String((document.getElementById('orderSearch') as HTMLInputElement | null)?.value || '');
  const status = String((document.getElementById('orderStatusFilter') as HTMLSelectElement | null)?.value || '');

  const filtered = getState().orders.filter((order) => matchesSearch(order, query)).filter((order) => !status || order.status === status);
  body.innerHTML = filtered.map(orderRow).join('') || `<tr><td colspan="7">Nenhuma OS encontrada.</td></tr>`;
}

function fillEditForm(order: ServiceOrder): void {
  const form = document.getElementById('osForm') as HTMLFormElement | null;
  if (!form) return;

  (form.elements.namedItem('orderId') as HTMLInputElement).value = order.id;
  (form.elements.namedItem('customerId') as HTMLSelectElement).value = order.customerId;
  (form.elements.namedItem('technician') as HTMLInputElement).value = order.technician;
  (form.elements.namedItem('model') as HTMLInputElement).value = order.model;
  (form.elements.namedItem('imei') as HTMLInputElement).value = order.imei;
  (form.elements.namedItem('defect') as HTMLInputElement).value = order.defect;
  (form.elements.namedItem('passwordPattern') as HTMLInputElement).value = order.passwordPattern;
  (form.elements.namedItem('estimatedDelivery') as HTMLInputElement).value = order.estimatedDelivery;
  (form.elements.namedItem('entryState') as HTMLTextAreaElement).value = order.entryState;
  (form.elements.namedItem('paymentOnDelivery') as HTMLSelectElement).value = order.paymentOnDelivery ? 'SIM' : 'NAO';
  (form.elements.namedItem('paymentMethod') as HTMLSelectElement).value = order.paymentMethod;

  const selectedServiceIds = order.services.map((item) => item.serviceId);
  form.querySelectorAll<HTMLInputElement>('input[name="serviceIds"]').forEach((input) => {
    input.checked = selectedServiceIds.includes(input.value);
  });

  if (order.products[0]) {
    (form.elements.namedItem('productId') as HTMLSelectElement).value = order.products[0].productId;
    (form.elements.namedItem('quantity') as HTMLInputElement).value = String(order.products[0].quantity);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHistory(order: ServiceOrder): void {
  const panel = document.getElementById('orderHistoryPanel');
  if (!panel) return;

  panel.innerHTML = `
    <h3>Histórico da OS #${order.osNumber}</h3>
    <ul class="history-list">
      ${order.history.map((item) => `<li><strong>${item.type}</strong> - ${item.description} <span>${toDateTime(item.date)}</span></li>`).join('')}
    </ul>
    <h4>Observações técnicas</h4>
    <ul class="history-list">
      ${order.technicalNotes.map((note) => `<li>${note}</li>`).join('') || '<li>Sem observações.</li>'}
    </ul>
  `;
}

function handleTableActions(onDone: () => void): void {
  document.getElementById('ordersTableBody')?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLButtonElement)) return;

    const action = target.dataset.action;
    const orderId = target.dataset.id || '';
    const order = getState().orders.find((item) => item.id === orderId);
    if (!order) return;

    if (action === 'edit') {
      fillEditForm(order);
      renderHistory(order);
      return;
    }

    if (action === 'status') {
      const next = prompt(`Novo status da OS #${order.osNumber}:\n${ORDER_STATUS.join(', ')}`, order.status);
      if (!next) return;
      if (!ORDER_STATUS.includes(next as OsStatus)) return toast('Status inválido.', 'error');

      const result = changeOrderStatus(order.id, next as OsStatus);
      toast(result.message, result.ok ? 'success' : 'error');
      onDone();
      return;
    }

    if (action === 'note') {
      const note = prompt(`Adicionar observação técnica na OS #${order.osNumber}`) || '';
      if (!note.trim()) return;
      const result = addOrderTechnicalNote(order.id, note);
      toast(result.message, result.ok ? 'success' : 'error');
      onDone();
      return;
    }

    if (action === 'deliver') {
      const result = deliverOrder(order.id);
      toast(result.message, result.ok ? 'success' : 'error');
      onDone();
      return;
    }

    if (action === 'print') {
      const popup = window.open('', '_blank', 'width=800,height=600');
      if (!popup) return toast('Não foi possível abrir a impressão.', 'error');
      popup.document.write(buildReceipt(order));
      popup.document.close();
      popup.focus();
      popup.print();
      return;
    }
  });
}

export function bindOrders(onDone: () => void): void {
  document.getElementById('osForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const state = getState();

    const orderId = String(fd.get('orderId') || '');
    const customerId = String(fd.get('customerId') || '');
    const customer = state.customers.find((item) => item.id === customerId);
    const technician = String(fd.get('technician') || '');
    const model = String(fd.get('model') || '');
    const imei = normalizeImei(String(fd.get('imei') || ''));
    const defect = String(fd.get('defect') || '');
    const passwordPattern = String(fd.get('passwordPattern') || '');
    const estimatedDelivery = String(fd.get('estimatedDelivery') || '');
    const entryState = String(fd.get('entryState') || '');
    const paymentOnDelivery = String(fd.get('paymentOnDelivery') || 'SIM') === 'SIM';
    const paymentMethod = String(fd.get('paymentMethod') || 'DINHEIRO') as ServiceOrder['paymentMethod'];

    if (!customer) return toast('Selecione um cliente válido.', 'error');
    if (!isValidImei(imei)) return toast('IMEI inválido. Informe 15 dígitos numéricos.', 'error');
    if (!validateRequired([
      ['Técnico', technician],
      ['Modelo', model],
      ['Defeito', defect],
      ['Previsão de entrega', estimatedDelivery],
      ['Estado do aparelho na entrada', entryState]
    ])) return;

    const serviceIds = fd.getAll('serviceIds').map(String);
    const services = collectServiceItems(serviceIds);
    const productId = String(fd.get('productId') || '');
    const quantity = Number(fd.get('quantity') || 0);

    if (productId && quantity <= 0) return toast('Quantidade da peça inválida.', 'error');
    const products = collectProductItems(productId, quantity);

    if (orderId) {
      const result = updateOrder(orderId, {
        technician,
        model,
        imei,
        defect,
        passwordPattern,
        estimatedDelivery,
        entryState,
        services,
        products,
        paymentOnDelivery,
        paymentMethod
      });
      toast(result.message, result.ok ? 'success' : 'error');
      onDone();
      return;
    }

    const created = addOrder({
      customerId: customer.id,
      customerName: customer.name,
      technician,
      model,
      imei,
      defect,
      passwordPattern,
      estimatedDelivery,
      entryState,
      technicalNotes: [],
      services,
      products,
      status: 'ABERTA',
      paymentOnDelivery,
      paymentMethod
    });

    toast(`OS #${created.osNumber} criada com sucesso.`);
    onDone();
  });

  document.getElementById('orderSearch')?.addEventListener('input', applyFilters);
  document.getElementById('orderStatusFilter')?.addEventListener('change', applyFilters);

  handleTableActions(onDone);
}
