import { describe, it, expect } from 'vitest';
import * as f from './orderFlow';

const shift = { openedAt: '2026-11-18T18:00:00Z', closedAt: null };
const o = (extra) => ({ total: 100, paymentMethod: 'Efectivo', items: [], ...extra });

describe('calcShiftStats', () => {
  it('creado antes, cobrado durante el turno → cuenta', () => {
    const s = f.calcShiftStats([o({ timestamp: Date.parse('2026-11-18T17:50:00Z'), paidAt: '2026-11-18T18:10:00Z' })], shift);
    expect(s.count).toBe(1); expect(s.efectivo).toBe(100);
  });
  it('sin paidAt no cuenta aunque status sea paid', () => {
    expect(f.calcShiftStats([o({ status: 'paid' })], shift).count).toBe(0);
  });
  it('cobrado antes de abrir no cuenta', () => {
    expect(f.calcShiftStats([o({ paidAt: '2026-11-18T17:59:00Z' })], shift).count).toBe(0);
  });
  it('cobrado después de cerrar el turno no cuenta', () => {
    const closed = { openedAt: '2026-11-18T18:00:00Z', closedAt: '2026-11-18T22:00:00Z' };
    expect(f.calcShiftStats([o({ paidAt: '2026-11-18T22:10:00Z' })], closed).count).toBe(0);
  });
  it('separa envío y transferencia', () => {
    const s = f.calcShiftStats([o({ paidAt: '2026-11-18T19:00:00Z', paymentMethod: 'Transferencia', delivery: { deliveryFee: 30 } })], shift);
    expect(s.transferencia).toBe(70); expect(s.envios).toBe(30); expect(s.enviosEfectivo).toBe(0);
  });
});

describe('items de cocina', () => {
  it('solo imprime lo nuevo', () => {
    const items = [{ id: 1, quantity: 3, sentQty: 3 }, { id: 2, quantity: 2, sentQty: 0 }, { id: 3, quantity: 4, sentQty: 1 }];
    expect(f.pendingKitchenItems(items).map(i => [i.id, i.quantity])).toEqual([[2, 2], [3, 3]]);
  });
  it('bajar cantidad ya enviada no imprime nada', () => {
    expect(f.pendingKitchenItems([{ id: 1, quantity: 1, sentQty: 3 }])).toEqual([]);
  });
  it('markItemsSent iguala sentQty a quantity', () => {
    expect(f.markItemsSent([{ id: 1, quantity: 2 }])[0].sentQty).toBe(2);
  });
});

describe('planPosAction', () => {
  it('guardar sin mesa da error', () => {
    expect(f.planPosAction('save', { isDelivery: false, table: null, hasPending: true }).error).toMatch(/mesa/);
  });
  it('cobrar con pendientes manda a cocina, cobra e imprime ambos', () => {
    expect(f.planPosAction('checkout', { isDelivery: false, table: null, hasPending: true }))
      .toEqual({ status: 'en_preparacion', markPaid: true, printKitchen: true, printTicket: true });
  });
  it('cobrar domicilio nuevo va a cocina', () => {
    expect(f.planPosAction('checkout', { isDelivery: true, table: null, hasPending: true }).status).toBe('en_preparacion');
  });
  it('cobrar mesa ya preparada la cierra', () => {
    expect(f.planPosAction('checkout', { isDelivery: false, table: 'Mesa 1', currentStatus: 'open', hasPending: false }).status).toBe('paid');
  });
  it('cobrar mesa mientras cocina prepara la deja en cocina', () => {
    expect(f.planPosAction('checkout', { isDelivery: false, table: 'Mesa 1', currentStatus: 'en_preparacion', hasPending: false }).status).toBe('en_preparacion');
  });
  it('cobrar llevar que cocina ya terminó lo cierra', () => {
    expect(f.planPosAction('checkout', { isDelivery: false, table: null, currentStatus: 'listo', hasPending: false }).status).toBe('paid');
  });
  it('guardar mesa en cocina no la saca de cocina', () => {
    expect(f.planPosAction('save', { isDelivery: false, table: 'Mesa 1', currentStatus: 'en_preparacion', hasPending: true }).status).toBe('en_preparacion');
  });
  it('preparar manda a cocina sin cobrar ni ticket', () => {
    expect(f.planPosAction('prepare', { isDelivery: false, table: 'Mesa 1', hasPending: true }))
      .toEqual({ status: 'en_preparacion', markPaid: false, printKitchen: true, printTicket: false });
  });
});

describe('cocina y entrega', () => {
  it('mesa cobrada lista → paid, sin ticket', () => {
    const ord = { table: 'Mesa 1', paidAt: '2026-11-18T18:10:00Z' };
    expect(f.kitchenReadyStatus(ord)).toBe('paid'); expect(f.kitchenPrintsTicket(ord)).toBe(false);
  });
  it('mesa sin cobrar lista → open, sin ticket (se imprime al cobrar)', () => {
    expect(f.kitchenReadyStatus({ table: 'Mesa 1' })).toBe('open'); expect(f.kitchenPrintsTicket({ table: 'Mesa 1' })).toBe(false);
  });
  it('domicilio por cobrar lista → imprime ticket para el repartidor', () => {
    expect(f.kitchenPrintsTicket({ delivery: {} })).toBe(true);
  });
  it('llevar sin cobrar lista → listo', () => expect(f.kitchenReadyStatus({})).toBe('listo'));
  it('domicilio lista → listo', () => expect(f.kitchenReadyStatus({ delivery: {}, paidAt: 'x' })).toBe('listo'));
  it('entregar conserva paidAt previo', () => {
    expect(f.deliveredUpdate({ paidAt: 'A' }, 'B')).toEqual({ status: 'entregado', paidAt: 'A' });
    expect(f.deliveredUpdate({}, 'B')).toEqual({ status: 'entregado', paidAt: 'B' });
  });
  it('mesa ocupada hasta cerrarse', () => {
    expect(f.isTableOccupied({ table: 'Mesa 1', status: 'en_preparacion' })).toBe(true);
    expect(f.isTableOccupied({ table: 'Mesa 1', status: 'paid' })).toBe(false);
  });
});

describe('clampDiscount', () => {
  it('no pasa del subtotal ni baja de 0', () => {
    expect(f.clampDiscount(500, 120)).toBe(120); expect(f.clampDiscount(-5, 120)).toBe(0); expect(f.clampDiscount('abc', 120)).toBe(0);
  });
});
