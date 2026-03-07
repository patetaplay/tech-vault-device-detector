export function appShell(title, body) {
    return `
  <div class="layout">
    <aside class="sidebar">
      <h1>Tech Vault</h1>
      <nav>
        <a href="#/dashboard">Dashboard</a>
        <a href="#/clientes">Clientes</a>
        <a href="#/produtos">Produtos</a>
        <a href="#/estoque">Estoque</a>
        <a href="#/estoque-relatorio">Relatório estoque</a>
        <a href="#/servicos">Serviços</a>
        <a href="#/os">Ordens de Serviço</a>
        <a href="#/caixa">Caixa</a>
        <a href="#/vendas">Vendas balcão</a>
        <a href="#/financeiro">Relatório financeiro</a>
      </nav>
    </aside>
    <main>
      <header class="page-header">
        <h2>${title}</h2>
        <button id="logoutBtn" class="button-secondary">Sair</button>
      </header>
      ${body}
    </main>
  </div>`;
}
export function emptyState(message) {
    return `<div class="empty">${message}</div>`;
}
export function toast(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
}
