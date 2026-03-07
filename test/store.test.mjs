import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStorageMock } from './helpers.mjs';

globalThis.localStorage = createLocalStorageMock();

const store = await import('../dist/modules/store.js');

function freshState() {
  store.resetState();
  return store.getState();
}

test('não permite abrir dois caixas ao mesmo tempo', () => {
  freshState();
  const first = store.openCashSession(100, 'Teste');
  const second = store.openCashSession(50, 'Teste');

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
});

test('saída financeira exige categoria', () => {
  freshState();
  store.openCashSession(100, 'Teste');
  const result = store.addCashEntry({
    type: 'SAIDA',
    category: '',
    description: 'Retirada sem categoria',
    amount: 10,
    paymentMethod: 'PIX'
  });

  assert.equal(result.ok, false);
});

test('venda de balcão baixa estoque e registra movimentação', () => {
  const state = freshState();
  store.openCashSession(100, 'Teste');

  const product = state.products[0];
  const initialQty = product.stockQty;

  const sale = store.createCounterSale({ productId: product.id, quantity: 1, paymentMethod: 'DINHEIRO' });
  assert.equal(sale.ok, true);

  const updated = store.getState();
  const updatedProduct = updated.products.find((p) => p.id === product.id);
  assert.ok(updatedProduct);
  assert.equal(updatedProduct.stockQty, initialQty - 1);

  const movement = updated.stockMovements.find((m) => m.referenceType === 'VENDA_BALCAO' && m.productId === product.id);
  assert.ok(movement);
});

test('não permite estoque negativo em venda', () => {
  const state = freshState();
  store.openCashSession(100, 'Teste');

  const product = state.products[0];
  const result = store.createCounterSale({ productId: product.id, quantity: product.stockQty + 1, paymentMethod: 'PIX' });
  assert.equal(result.ok, false);
});
