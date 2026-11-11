// Purchase bridge for the app (bundled into www/store.js on each build).
// One non-consumable Google Play product unlocks the full game: product ID "full_game".
import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

const ID = 'full_game';
const T = PURCHASE_TYPE.INAPP;
const state = (p) => String(p && p.purchaseState != null ? p.purchaseState : '').toUpperCase();
const isDone = (p) => { const s = state(p); return s === '' || s === 'PURCHASED' || s === '1'; };
const isPending = (p) => { const s = state(p); return s === 'PENDING' || s === '2'; };

async function owned() {
  try {
    const { purchases = [] } = await NativePurchases.getPurchases({ productType: T });
    return purchases.some((p) => p.productIdentifier === ID && isDone(p));
  } catch (e) {
    console.warn('HLStore.owned', e);
    return null; // unknown (offline, Play unavailable): leave things as they are
  }
}

window.HLStore = {
  native: Capacitor.isNativePlatform(),
  productId: ID,
  owned,
  async price() {
    try {
      const { product } = await NativePurchases.getProduct({ productIdentifier: ID, productType: T });
      return (product && product.priceString) || '';
    } catch (e) { return ''; }
  },
  // 'owned' | 'pending' | 'none'; throws if the player cancels or Play reports an error
  async buy() {
    const tx = await NativePurchases.purchaseProduct({ productIdentifier: ID, productType: T, quantity: 1 });
    if (tx && isPending(tx)) return 'pending';
    if (tx && isDone(tx)) return 'owned';
    return (await owned()) ? 'owned' : 'none';
  },
  async restore() {
    try { await NativePurchases.restorePurchases(); } catch (e) { /* fall through to a fresh check */ }
    return owned();
  },
};
