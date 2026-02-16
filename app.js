const STORAGE_KEYS = {
  tools: 'panel.tools',
  checklist: 'panel.checklist',
  serviceOrders: 'panel.serviceOrders'
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

const state = {
  tools: load(STORAGE_KEYS.tools, defaultTools),
  checklist: load(STORAGE_KEYS.checklist, defaultChecklist),
  serviceOrders: load(STORAGE_KEYS.serviceOrders, [])
};

const toolGrid = document.getElementById('toolGrid');
const checklistEl = document.getElementById('checklist');
const templateList = document.getElementById('templateList');
const serviceOrderTable = document.getElementById('serviceOrderTable');
const totalBilledEl = document.getElementById('totalBilled');

function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return structuredClone(fallback);
  try {
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function persist() {
  localStorage.setItem(STORAGE_KEYS.tools, JSON.stringify(state.tools));
  localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(state.checklist));
  localStorage.setItem(STORAGE_KEYS.serviceOrders, JSON.stringify(state.serviceOrders));
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
      setTimeout(() => (btn.textContent = 'Copiar'), 1200);
    });
    div.appendChild(btn);
    templateList.appendChild(div);
  });
}

function renderServiceOrders() {
  serviceOrderTable.innerHTML = '';

  let total = 0;
  state.serviceOrders.forEach((order, index) => {
    total += order.valor;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${order.cliente}</td>
      <td>${order.servico}</td>
      <td class="status-ok">${formatCurrency(order.valor)}</td>
      <td><button class="secondary" data-del-os="${index}">Excluir</button></td>
    `;
    serviceOrderTable.appendChild(tr);
  });

  totalBilledEl.textContent = formatCurrency(total);
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

  if (!cliente || !servico || Number.isNaN(valor) || valor < 0) return;

  state.serviceOrders.unshift({ cliente, servico, valor });
  persist();
  renderServiceOrders();
  e.target.reset();
});

serviceOrderTable.addEventListener('click', (e) => {
  const idx = e.target.getAttribute('data-del-os');
  if (idx === null) return;
  state.serviceOrders.splice(idx, 1);
  persist();
  renderServiceOrders();
});

updateClock();
setInterval(updateClock, 1000);
renderTools();
renderChecklist();
renderTemplates();
renderServiceOrders();
