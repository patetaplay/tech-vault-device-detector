import { appShell, emptyState, toast } from '../../components/ui.js';
import { validateRequired } from '../../core/validation.js';
import { addCustomer, getState } from '../store.js';

export function renderCustomers(): string {
  const customers = getState().customers;

  return appShell('Cadastro de Clientes', `
    <form id="customerForm" class="form-grid inline">
      <label>Nome<input name="name" /></label>
      <label>Telefone<input name="phone" /></label>
      <label>Email<input name="email" type="email" /></label>
      <button type="submit">Salvar cliente</button>
    </form>
    ${customers.length === 0 ? emptyState('Nenhum cliente cadastrado ainda.') : `
    <table><thead><tr><th>Nome</th><th>Telefone</th><th>Email</th></tr></thead>
      <tbody>${customers.map((c) => `<tr><td>${c.name}</td><td>${c.phone}</td><td>${c.email}</td></tr>`).join('')}</tbody>
    </table>`}`);
}

export function bindCustomers(onDone: () => void): void {
  document.getElementById('customerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const name = String(fd.get('name') || '');
    const phone = String(fd.get('phone') || '');
    const email = String(fd.get('email') || '');

    if (!validateRequired([['Nome', name], ['Telefone', phone], ['Email', email]])) return;
    addCustomer({ name, phone, email });
    toast('Cliente cadastrado com sucesso.');
    onDone();
  });
}
