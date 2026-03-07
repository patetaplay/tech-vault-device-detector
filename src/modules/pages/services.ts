import { appShell, emptyState, toast } from '../../components/ui.js';
import { toCurrency } from '../../core/format.js';
import { validateRequired } from '../../core/validation.js';
import { addService, getState } from '../store.js';

export function renderServices(): string {
  const services = getState().services;

  return appShell('Cadastro de Serviços', `
    <form id="serviceForm" class="form-grid inline">
      <label>Nome<input name="name" /></label>
      <label>Preço base<input name="basePrice" type="number" step="0.01" min="0.01" /></label>
      <button type="submit">Salvar serviço</button>
    </form>
    ${services.length === 0 ? emptyState('Nenhum serviço cadastrado ainda.') : `
    <table><thead><tr><th>Serviço</th><th>Preço</th></tr></thead>
      <tbody>${services.map((s) => `<tr><td>${s.name}</td><td>${toCurrency(s.basePrice)}</td></tr>`).join('')}</tbody>
    </table>`}`);
}

export function bindServices(onDone: () => void): void {
  document.getElementById('serviceForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const name = String(fd.get('name') || '');
    const basePrice = Number(fd.get('basePrice') || 0);

    if (!validateRequired([['Nome', name]])) return;
    if (basePrice <= 0) return toast('Preço base deve ser maior que zero.', 'error');

    addService({ name, basePrice });
    toast('Serviço cadastrado com sucesso.');
    onDone();
  });
}
