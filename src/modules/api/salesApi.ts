import { createCounterSale } from '../store.js';
import { PaymentMethod } from '../../types.js';

export function createCounterSaleRoute(payload: { productId: string; quantity: number; paymentMethod: PaymentMethod }) {
  return createCounterSale(payload);
}
