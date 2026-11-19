// Reglas del flujo de pedidos. `status` = etapa (cocina/entrega); pagado = `paidAt` no nulo.
// Todo aquí es puro: las pantallas deciden con estas funciones y luego guardan/imprimen.

export const isPaid = (order) => !!order?.paidAt;

export const paidMs = (order) => {
  const ms = Date.parse(order?.paidAt);
  return Number.isNaN(ms) ? null : ms;
};

// Lo que falta mandar a cocina: cantidad actual menos lo ya enviado.
export const pendingKitchenItems = (items = []) =>
  items
    .map(i => ({ ...i, quantity: i.quantity - (i.sentQty ?? 0) }))
    .filter(i => i.quantity > 0);

export const markItemsSent = (items = []) => items.map(i => ({ ...i, sentQty: i.quantity }));

export const clampDiscount = (discount, subtotal) => {
  const d = parseFloat(discount);
  if (!(d > 0)) return 0;
  return Math.min(d, subtotal);
};

// Qué hacer al pulsar Guardar / Preparar / Cobrar en el POS.
export function planPosAction(action, { isDelivery, table, currentStatus, hasPending }) {
  if (action === 'save') {
    if (!table && !isDelivery) return { error: 'Elige una mesa en 🗺️ Mesas para guardar la cuenta.' };
    const keep = currentStatus === 'en_preparacion' || currentStatus === 'listo';
    return { status: keep ? currentStatus : 'open', markPaid: false, printKitchen: false, printTicket: false };
  }
  if (action === 'prepare') {
    return { status: 'en_preparacion', markPaid: false, printKitchen: true, printTicket: false };
  }
  // checkout
  if (hasPending) return { status: 'en_preparacion', markPaid: true, printKitchen: true, printTicket: true };
  let status;
  if (isDelivery) status = currentStatus ?? 'listo';
  else status = currentStatus === 'en_preparacion' ? 'en_preparacion' : 'paid';
  return { status, markPaid: true, printKitchen: false, printTicket: true };
}

// Estado al que pasa un pedido cuando cocina lo marca listo.
export function kitchenReadyStatus(order) {
  if (order.delivery) return 'listo';
  if (isPaid(order)) return 'paid';
  return order.table ? 'open' : 'listo';
}

// Cocina imprime ticket solo para domicilios por cobrar (el repartidor cobra con él).
export const kitchenPrintsTicket = (order) => !!order.delivery && !isPaid(order);

export const deliveredUpdate = (order, nowIso) => ({ status: 'entregado', paidAt: order.paidAt ?? nowIso });

export const isTableOccupied = (order) => !!order.table && !['paid', 'entregado'].includes(order.status);

// Totales del turno: pedidos cobrados (paidAt) dentro del turno.
export function calcShiftStats(orders, shift) {
  const stats = { count: 0, efectivo: 0, transferencia: 0, envios: 0, enviosEfectivo: 0 };
  if (!shift) return stats;
  const from = Date.parse(shift.openedAt);
  const to = shift.closedAt ? Date.parse(shift.closedAt) : Infinity;
  orders.forEach(o => {
    const ms = paidMs(o);
    if (ms === null || ms < from || ms > to) return;
    const deliveryFee = parseFloat(o.delivery?.deliveryFee || 0);
    const foodTotal = parseFloat(o.total || 0) - deliveryFee;
    const method = (o.paymentMethod || 'Efectivo').toLowerCase();
    stats.count += 1;
    stats.envios += deliveryFee;
    if (method === 'efectivo') {
      stats.efectivo += foodTotal;
      stats.enviosEfectivo += deliveryFee;
    } else {
      stats.transferencia += foodTotal; // Transferencia (y cualquier otro método no-efectivo)
    }
  });
  return stats;
}
