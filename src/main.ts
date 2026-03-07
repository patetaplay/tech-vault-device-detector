import { clearSession, getSessionUser } from './core/session.js';
import { Route } from './core/types.js';
import { bindLogin, renderLogin } from './modules/pages/auth.js';
import { renderDashboard } from './modules/pages/dashboard.js';
import { bindCustomers, renderCustomers } from './modules/pages/customers.js';
import { bindProducts, renderProducts } from './modules/pages/products.js';
import { bindInventory, renderInventory } from './modules/pages/inventory.js';
import { renderStockReport } from './modules/pages/stockReport.js';
import { bindServices, renderServices } from './modules/pages/services.js';
import { bindOrders, renderOrders } from './modules/pages/orders.js';
import { bindCash, renderCash } from './modules/pages/cash.js';
import { bindSales, renderSales } from './modules/pages/sales.js';
import { bindFinance, renderFinance } from './modules/pages/finance.js';

const appEl = document.getElementById('app');
if (!(appEl instanceof HTMLElement)) throw new Error('App root não encontrada.');
const appRoot: HTMLElement = appEl;

function bindGlobalEvents() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearSession();
    render();
  });
}

function routeView(route: string): string {
  const safeRoute = (route || '#/dashboard') as Route;

  switch (safeRoute) {
    case '#/clientes': return renderCustomers();
    case '#/produtos': return renderProducts();
    case '#/estoque': return renderInventory();
    case '#/estoque-relatorio': return renderStockReport();
    case '#/servicos': return renderServices();
    case '#/os': return renderOrders();
    case '#/caixa': return renderCash();
    case '#/vendas': return renderSales();
    case '#/financeiro': return renderFinance();
    case '#/dashboard':
    default: return renderDashboard();
  }
}

function bindRouteEvents(route: string) {
  switch (route as Route) {
    case '#/clientes': bindCustomers(render); break;
    case '#/produtos': bindProducts(render); break;
    case '#/estoque': bindInventory(render); break;
    case '#/servicos': bindServices(render); break;
    case '#/os': bindOrders(render); break;
    case '#/caixa': bindCash(render); break;
    case '#/vendas': bindSales(render); break;
    case '#/financeiro': bindFinance(render); break;
    default: break;
  }
}

function render() {
  if (!getSessionUser()) {
    appRoot.innerHTML = renderLogin();
    bindLogin(render);
    return;
  }

  const route = location.hash || '#/dashboard';
  appRoot.innerHTML = routeView(route);
  bindGlobalEvents();
  bindRouteEvents(route);
}

window.addEventListener('hashchange', render);
render();
