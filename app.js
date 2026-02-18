const STORAGE_KEYS = {
  tools: 'panel.tools',
  checklist: 'panel.checklist',
  exeApps: 'panel.exeApps',
  serviceOrders: 'panel.serviceOrders',
  cashEntries: 'panel.cashEntries'
};

const defaultTools = [
  { name: 'AnyDesk', url: 'https://anydesk.com/pt' },
  { name: 'USB Redirector', url: 'https://www.incentivespro.com/usb-redirector.html' },
  { name: 'WhatsApp Web', url: 'https://web.whatsapp.com/' },
  { name: 'Google Drive', url: 'https://drive.google.com/' }
];

const defaultChecklist = [
  { text: 'Confirmar modelo e versão do aparelho', done: false },
  { text: 'Validar conexão remota e internet', done: false },
  { text: 'Explicar risco e prazo para cliente', done: false },
  { text: 'Finalizar com teste funcional', done: false }
];

const messageTemplates = [
  'Olá! Vou iniciar seu atendimento agora. Em 2 minutos te passo os próximos passos.',
  'Conexão concluída ✅. Vou executar o procedimento e te atualizar em seguida.',
  'Atendimento finalizado com sucesso. Se quiser, posso te enviar um resumo do que foi feito.'
];

const PAYMENT_LABELS = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito'
};

const STATUS_LABELS = {
  pago: 'Pago',
  em_aberto: 'Em aberto'
};

const todayIso = getTodayIso();

const state = {
  tools: load(STORAGE_KEYS.tools, defaultTools),
  checklist: load(STORAGE_KEYS.checklist, defaultChecklist),
  exeApps: migrateExeApps(load(STORAGE_KEYS.exeApps, [])),
  serviceOrders: migrateServiceOrders(load(STORAGE_KEYS.serviceOrders, [])),
  cashEntries: load(STORAGE_KEYS.cashEntries, [])
};

const toolGrid = document.getElementById('toolGrid');
const checklistEl = document.getElementById('checklist');
const templateList = document.getElementById('templateList');
const exeTable = document.getElementById('exeTable');
const exeHelpText = document.getElementById('exeHelpText');
const serviceOrderTable = document.getElementById('serviceOrderTable');
const cashTable = document.getElementById('cashTable');
const cashSummary = document.getElementById('cashSummary');

document.getElementById('osDataInput').value = todayIso;
document.getElementById('cashDataInput').value = todayIso;

if (!window.desktop?.openExe) {
  exeHelpText.textContent = 'Modo navegador: o cadastro funciona, mas abrir .exe só está disponível no app desktop (Electron).';
}

function getTodayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return structuredClone(fallback);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function migrateExeApps(apps) {
  return apps.map((app) => ({
    id: app.id || crypto.randomUUID(),
    nome: app.nome || 'App local',
    caminho: app.caminho || ''
  }));
}

function migrateServiceOrders(orders) {
  return orders.map((order) => ({
    ...order,
    id: order.id || crypto.randomUUID(),
    data: order.data || todayIso,
    valor: Number(order.valor) || 0,
    pagamento: order.pagamento || 'pix',
    status: order.status || 'pago'
  }));
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(value) {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function persist() {
  localStorage.setItem(STORAGE_KEYS.tools, JSON.stringify(state.tools));
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state.checklist));
  localStorage.setItem(STORAGE_KEYS.exeApps, JSON.stringify(state.exeApps));
  localStorage.setItem(STORAGE_KEYS.serviceOrders, JSON.stringify(state.serviceOrders));
  localStorage.setItem(STORAGE_KEYS.cashEntries, JSON.stringify(state.cashEntries));
}

function renderTools() {
  toolGrid.innerHTML = '';
  state.tools.forEach((tool) => {
    const a = document.createElement('a');
    a.href = tool.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'tool-btn';
    a.textContent = tool.name;
    toolGrid.appendChild(a);
  });
}

function renderExeApps() {
  exeTable.innerHTML = '';

  state.exeApps.forEach((app) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${app.nome}</td>
      <td class="path-cell">${app.caminho}</td>
      <td class="action-row">
        <button class="secondary" data-open-exe="${app.id}">Abrir</button>
        <button class="secondary" data-del-exe="${app.id}">Excluir</button>
      </td>
    `;
    exeTable.appendChild(tr);
  });
}

async function openExeApp(id) {
  const app = state.exeApps.find((item) => item.id === id);
  if (!app) return;

  if (!window.desktop?.openExe) {
    alert('Para abrir .exe, use este painel no aplicativo desktop (Electron).');
    return;
  }

  const result = await window.desktop.openExe(app.caminho);
  if (!result?.ok) {
    alert(`Não foi possível abrir o executável.\n${result?.error || 'Erro desconhecido.'}`);
  }
}

function renderChecklist() {
  checklistEl.innerHTML = '';
  state.checklist.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `check-item ${item.done ? 'done' : ''}`;
    li.innerHTML = `
      <input type="checkbox" ${item.done ? 'checked' : ''} data-idx="${index}" />
      <span>${item.text}</span>
      <button class="secondary" data-remove="${index}">x</button>
    `;
    checklistEl.appendChild(li);
  });
}

function renderTemplates() {
  templateList.innerHTML = '';
  messageTemplates.forEach((text) => {
    const div = document.createElement('div');
    div.className = 'template';
    div.innerHTML = `<p>${text}</p>`;
    const btn = document.createElement('button');
    btn.textContent = 'Copiar';
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Copiado!';
      setTimeout(() => {
        btn.textContent = 'Copiar';
      }, 1200);
    });
    div.appendChild(btn);
    templateList.appendChild(div);
  });
}

function renderServiceOrders() {
  serviceOrderTable.innerHTML = '';

  const sorted = [...state.serviceOrders].sort((a, b) => b.data.localeCompare(a.data));
  sorted.forEach((order) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(order.data)}</td>
      <td>${order.cliente}</td>
      <td>${order.servico}</td>
      <td class="status-ok">${formatCurrency(order.valor)}</td>
      <td>${PAYMENT_LABELS[order.pagamento] || order.pagamento}</td>
      <td><span class="status-pill ${order.status === 'pago' ? 'status-paid' : 'status-open'}">${STATUS_LABELS[order.status] || order.status}</span></td>
      <td><button class="secondary" data-del-os="${order.id}">Excluir</button></td>
    `;
    serviceOrderTable.appendChild(tr);
  });
}

function getWeekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? 6 : day - 1;

  const start = new Date(current);
  start.setDate(current.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function dateInRange(isoDate, start, end) {
  const target = new Date(`${isoDate}T12:00:00`);
  return target >= start && target <= end;
}

function calculateCashSummary() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);
  const week = getWeekRange(now);

  const periods = {
    diario: {
      label: 'Fechamento diário',
      match: (date) => date === today
    },
    semanal: {
      label: 'Fechamento semanal',
      match: (date) => dateInRange(date, week.start, week.end)
    },
    mensal: {
      label: 'Fechamento mensal',
      match: (date) => date.startsWith(month)
    }
  };

  const result = {};
  Object.entries(periods).forEach(([key, config]) => {
    const paidOrders = state.serviceOrders.filter((order) => config.match(order.data) && order.status === 'pago');
    const openOrders = state.serviceOrders.filter((order) => config.match(order.data) && order.status === 'em_aberto');

    const ganhosOS = paidOrders.reduce((sum, order) => sum + order.valor, 0);
    const emAbertoOS = openOrders.reduce((sum, order) => sum + order.valor, 0);

    const extraEntradas = state.cashEntries
      .filter((entry) => config.match(entry.data) && entry.tipo === 'entrada')
      .reduce((sum, entry) => sum + entry.valor, 0);

    const gastos = state.cashEntries
      .filter((entry) => config.match(entry.data) && entry.tipo === 'saida')
      .reduce((sum, entry) => sum + entry.valor, 0);

    const ganhos = ganhosOS + extraEntradas;
    result[key] = {
      label: config.label,
      ganhos,
      gastos,
      lucro: ganhos - gastos,
      osPagas: ganhosOS,
      osAbertas: emAbertoOS,
      extras: extraEntradas
    };
  });

  return result;
}

function renderCashSummary() {
  const summary = calculateCashSummary();
  cashSummary.innerHTML = '';

  Object.values(summary).forEach((item) => {
    const block = document.createElement('article');
    block.className = 'summary-card';
    block.innerHTML = `
      <h4>${item.label}</h4>
      <p>Ganhos: <strong>${formatCurrency(item.ganhos)}</strong></p>
      <p class="muted">↳ OS pagas: ${formatCurrency(item.osPagas)} | Entradas extras: ${formatCurrency(item.extras)}</p>
      <p class="muted">↳ OS em aberto: ${formatCurrency(item.osAbertas)}</p>
      <p>Gastos: <strong class="text-danger">${formatCurrency(item.gastos)}</strong></p>
      <p>Resultado: <strong class="${item.lucro >= 0 ? 'status-ok' : 'text-danger'}">${formatCurrency(item.lucro)}</strong></p>
    `;
    cashSummary.appendChild(block);
  });
}

function renderCashEntries() {
  cashTable.innerHTML = '';

  const sorted = [...state.cashEntries].sort((a, b) => b.data.localeCompare(a.data));
  sorted.forEach((entry) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(entry.data)}</td>
      <td>${entry.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
      <td>${entry.descricao}</td>
      <td class="${entry.tipo === 'entrada' ? 'status-ok' : 'text-danger'}">${formatCurrency(entry.valor)}</td>
      <td><button class="secondary" data-del-cash="${entry.id}">Excluir</button></td>
    `;
    cashTable.appendChild(tr);
  });
}

function renderFinance() {
  renderServiceOrders();
  renderCashEntries();
  renderCashSummary();
}

function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  clock.textContent = now.toLocaleString('pt-BR', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

document.getElementById('addToolBtn').addEventListener('click', () => {
  document.getElementById('toolDialog').showModal();
});

document.getElementById('toolForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('toolName').value.trim();
  const url = document.getElementById('toolUrl').value.trim();
  if (!name || !url) return;
  state.tools.push({ name, url });
  persist();
  renderTools();
  e.target.reset();
  document.getElementById('toolDialog').close();
});

document.getElementById('exeForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('exeNomeInput').value.trim();
  const caminho = document.getElementById('exeCaminhoInput').value.trim();
  if (!nome || !caminho) return;

  state.exeApps.unshift({ id: crypto.randomUUID(), nome, caminho });
  persist();
  renderExeApps();
  e.target.reset();
});

exeTable.addEventListener('click', async (e) => {
  const idOpen = e.target.getAttribute('data-open-exe');
  const idDelete = e.target.getAttribute('data-del-exe');

  if (idOpen) {
    await openExeApp(idOpen);
    return;
  }

  if (idDelete) {
    state.exeApps = state.exeApps.filter((item) => item.id !== idDelete);
    persist();
    renderExeApps();
  }
});

document.getElementById('addTaskBtn').addEventListener('click', () => {
  const input = document.getElementById('newTaskInput');
  const text = input.value.trim();
  if (!text) return;
  state.checklist.push({ text, done: false });
  input.value = '';
  persist();
  renderChecklist();
});

checklistEl.addEventListener('click', (e) => {
  const idxToggle = e.target.getAttribute('data-idx');
  const idxRemove = e.target.getAttribute('data-remove');

  if (idxToggle !== null) {
    state.checklist[idxToggle].done = e.target.checked;
  }

  if (idxRemove !== null) {
    state.checklist.splice(idxRemove, 1);
  }

  persist();
  renderChecklist();
});

document.getElementById('serviceOrderForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const cliente = document.getElementById('osClienteInput').value.trim();
  const servico = document.getElementById('osServicoInput').value.trim();
  const valor = Number(document.getElementById('osValorInput').value);
  const pagamento = document.getElementById('osPagamentoInput').value;
  const status = document.getElementById('osStatusInput').value;
  const data = document.getElementById('osDataInput').value;

  if (!cliente || !servico || !data || Number.isNaN(valor) || valor < 0) return;

  state.serviceOrders.unshift({
    id: crypto.randomUUID(),
    cliente,
    servico,
    valor,
    pagamento,
    status,
    data
  });

  persist();
  renderFinance();
  e.target.reset();
  document.getElementById('osDataInput').value = todayIso;
  document.getElementById('osPagamentoInput').value = 'pix';
  document.getElementById('osStatusInput').value = 'pago';
});

serviceOrderTable.addEventListener('click', (e) => {
  const id = e.target.getAttribute('data-del-os');
  if (!id) return;
  state.serviceOrders = state.serviceOrders.filter((item) => item.id !== id);
  persist();
  renderFinance();
});

document.getElementById('cashForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const tipo = document.getElementById('cashTipoInput').value;
  const descricao = document.getElementById('cashDescricaoInput').value.trim();
  const valor = Number(document.getElementById('cashValorInput').value);
  const data = document.getElementById('cashDataInput').value;

  if (!tipo || !descricao || !data || Number.isNaN(valor) || valor < 0) return;

  state.cashEntries.unshift({
    id: crypto.randomUUID(),
    tipo,
    descricao,
    valor,
    data
  });

  persist();
  renderFinance();
  e.target.reset();
  document.getElementById('cashDataInput').value = todayIso;
  document.getElementById('cashTipoInput').value = 'entrada';
});

cashTable.addEventListener('click', (e) => {
  const id = e.target.getAttribute('data-del-cash');
  if (!id) return;
  state.cashEntries = state.cashEntries.filter((entry) => entry.id !== id);
  persist();
  renderFinance();
});

updateClock();
setInterval(updateClock, 1000);
renderTools();
renderExeApps();
renderChecklist();
renderTemplates();
renderFinance();
persist();
