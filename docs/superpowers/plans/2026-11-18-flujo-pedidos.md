# Flujo de pedidos: separar pago de cocina — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que todo pedido cobrado se cocine, se entregue y cuente en el corte correcto, sin comandas duplicadas ni cuentas perdidas, y quitar el código que sobra.

**Architecture:** Hoy `orders.status` mezcla "¿ya se pagó?" con "¿en qué etapa va en cocina?". Se agrega la columna `orders."paidAt"` (cuándo se cobró) y `status` queda solo como etapa. Las reglas de transición viven en un módulo puro `src/utils/orderFlow.js`, probado con Vitest; las pantallas (POS, Cocina, Repartidor, Turno, Dashboard) solo lo llaman. La impresión pasa por una cola para que dos impresiones seguidas no se pisen.

**Tech Stack:** React 18 + Vite 5, Supabase (Postgres + RLS + Realtime), Vitest (nuevo, solo dev).

**Spec:** la revisión del flujo de pedidos del 2026-11-18 (resumida abajo; los números son los de esa revisión).

## Spec (hallazgos que este plan resuelve)

1. "Cobrar" (mostrador/mesa) no imprime ticket ni manda a cocina.
2. "Cobrar (Domicilio)" se salta cocina y repartidor.
3. "Preparar (Domicilio)" imprime comanda y ticket a la vez; el ticket borra la comanda.
4. "Guardar" sin mesa crea una cuenta abierta que no aparece en ningún lado.
5. Guardar/Preparar una mesa reimprime toda la comanda (cocina duplica).
6. Mesero borra pedido en "Envíos" → RLS lo rechaza y no se le avisa.
7. El turno cuenta por hora de creación/último guardado, no de pago → pedidos fuera de todo corte.
8. Las mesas nunca aparecen en la pantalla de Cocina.
9. Descuento sin límite ni permiso.
10. En mesas "Guardar" y "Preparar" hacen lo mismo.
11. "Preparar sin turno" es inalcanzable.
12. Archivos sin uso: `OpenAccountsModal`, `DeliveryQueueModal`, `src/components/Finanzas/*`, `src/context/FinanzasContext.jsx`, `useKitchenCount`, props `modal`/`onClose` de `KitchenView`.
13. Protección de pestañas con PIN guardada pero nunca aplicada (`ALL_TABS`, `toggleProtected`, `protectedTabs`, `pinProtectionEnabled`).
14. Toast "Cuenta #<uuid> cargada".

## Global Constraints

- Estados de `orders.status` permitidos: `open`, `en_preparacion`, `listo`, `en_camino`, `entregado`, `paid`. `paid` pasa a significar "cerrado en local" (ya no implica el pago por sí solo). **Pagado = `paidAt` no nulo.**
- `paidAt` se escribe como ISO string (`new Date().toISOString()`), columna `timestamptz`.
- Todo texto visible en español; mensajes de error al usuario con `addToast(msg, 'error')`.
- PIN del dueño: `String(config.ownerPin ?? '1234')`.
- Sin dependencias nuevas de runtime. Única dev-dep nueva: `vitest`.
- Cada archivo SQL nuevo va en `supabase/` numerado y se corre a mano en Supabase → SQL Editor **antes** de hacer push.

## Review Focus

1. Pedido mandado a cocina antes de abrir el turno y cobrado después → debe contar en el turno donde se cobró (test en Task 1: `calcShiftStats` "creado antes, cobrado durante").
2. Mesa cobrada mientras cocina todavía la prepara → al marcarla lista en Cocina queda `paid`, no vuelve a `open` ni reimprime ticket (test en Task 1: `kitchenReadyStatus` con `paidAt` y `table`).
3. Bajar la cantidad de un producto ya enviado a cocina → no imprime nada negativo ni "0x" (test en Task 1: `pendingKitchenItems` con `quantity < sentQty`).
4. Descuento mayor al subtotal → total nunca negativo y descuento guardado = subtotal (test en Task 1: `clampDiscount`).
5. Domicilio cobrado al pedir y luego entregado → `paidAt` original no se pisa (test en Task 1: `deliveredUpdate`).

---

### Task 1: Reglas puras del flujo + Vitest

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `src/utils/orderFlow.js`
- Create: `src/utils/orderFlow.test.js`
- Modify: `src/context/TurnoContext.jsx` (borrar `calcShiftStats` de aquí e importarlo de `orderFlow`)

**Interfaces:**
- Produces (todas en `src/utils/orderFlow.js`):
  - `isPaid(order) → boolean` — `!!order.paidAt`
  - `paidMs(order) → number | null` — `Date.parse(order.paidAt)` o `null`
  - `pendingKitchenItems(items) → items[]` — solo lo que falta mandar; cada uno con `quantity = quantity - (sentQty ?? 0)`; excluye los ≤ 0
  - `markItemsSent(items) → items[]` — copia con `sentQty = quantity` en cada uno
  - `clampDiscount(discount, subtotal) → number` — entre 0 y subtotal
  - `planPosAction(action, { isDelivery, table, currentStatus, hasPending }) → { error?: string, status, markPaid, printKitchen, printTicket }` con `action ∈ 'save' | 'prepare' | 'checkout'`
  - `kitchenReadyStatus(order) → 'listo' | 'paid' | 'open'`
  - `kitchenPrintsTicket(order) → boolean` — `!!order.delivery && !isPaid(order)` (el repartidor lo necesita para cobrar; mesa y llevar reciben su ticket al cobrar)
  - `deliveredUpdate(order, nowIso) → { status: 'entregado', paidAt }` — conserva `paidAt` si ya existía
  - `isTableOccupied(order) → boolean` — `!!order.table && !['paid','entregado'].includes(order.status)`
  - `calcShiftStats(orders, shift) → { count, efectivo, transferencia, envios, enviosEfectivo }` — misma forma que hoy, pero filtra por `paidMs(o)` dentro de `[shift.openedAt, shift.closedAt ?? ∞]`

Reglas de `planPosAction` (la tabla que el código debe cumplir):

| action | condición | status | markPaid | printKitchen | printTicket |
|---|---|---|---|---|---|
| save | sin mesa y no domicilio | — `error: 'Elige una mesa en 🗺️ Mesas para guardar la cuenta.'` | | | |
| save | con mesa | `currentStatus` si es `en_preparacion`/`listo`, si no `open` | false | false | false |
| prepare | cualquiera | `en_preparacion` | false | true | false |
| checkout | `hasPending` | `en_preparacion` | true | true | true |
| checkout | sin pendientes, domicilio | `currentStatus ?? 'listo'` | true | false | true |
| checkout | sin pendientes, local, `currentStatus === 'en_preparacion'` | `en_preparacion` (cocina aún no termina; al marcar listo queda `paid`) | true | false | true |
| checkout | sin pendientes, local, otro estado | `paid` | true | false | true |

`kitchenReadyStatus`: domicilio → `listo`; local pagado → `paid`; local sin pagar con mesa → `open`; local sin pagar sin mesa → `listo` (queda en "Envíos / Llevar" para cobrar).

- [ ] **Step 1:** `npm i -D vitest` y agregar `"test": "vitest run"` a `scripts`.
- [ ] **Step 2: Escribir los tests que fallan** en `src/utils/orderFlow.test.js`:

```js
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
```

- [ ] **Step 3:** `npm test` → FAIL ("Failed to resolve import ./orderFlow").
- [ ] **Step 4:** Implementar `src/utils/orderFlow.js` con las firmas de **Interfaces**. `calcShiftStats` reutiliza el cuerpo actual de `TurnoContext.jsx` cambiando el filtro de `timestamp`/`status` por `paidMs`. En `TurnoContext.jsx` borrar la función local e importar `calcShiftStats` de `../utils/orderFlow`.
- [ ] **Step 5:** `npm test` → todos PASS. `npm run build` → "built in".
- [ ] **Step 6: Commit** — `git add package.json package-lock.json src/utils/orderFlow.js src/utils/orderFlow.test.js src/context/TurnoContext.jsx && git commit -m "Reglas puras del flujo de pedidos con pruebas"`

> Ojo: `package.json`/`package-lock.json` tienen cambios locales del mapa (leaflet). Hacer `git add -p package.json` y subir solo la línea de vitest y el script; o confirmar con el usuario si leaflet ya puede entrar.

---

### Task 2: Columna `paidAt` en la base

**Files:**
- Create: `supabase/004_pagado.sql`

**Interfaces:**
- Produces: columna `public.orders."paidAt" timestamptz` (nullable) e índice `orders_restaurant_paid (restaurant_id, "paidAt")`.

- [ ] **Step 1:** Escribir `004_pagado.sql`:

```sql
alter table public.orders add column "paidAt" timestamptz;
-- Pedidos ya cerrados se consideran pagados en su última hora registrada.
update public.orders set "paidAt" = to_timestamp("timestamp" / 1000.0)
 where status in ('paid', 'entregado');
create index orders_restaurant_paid on public.orders (restaurant_id, "paidAt");
```

- [ ] **Step 2:** Pedir al usuario que lo corra en Supabase. Verificar desde el navegador de la app (sesión de dueño): `supabase.from('orders').select('"paidAt"').limit(1)` → sin error.
- [ ] **Step 3: Commit** — `git add supabase/004_pagado.sql && git commit -m "Columna paidAt en pedidos"`

---

### Task 3: Cola de impresión

**Files:**
- Create: `src/utils/printHtml.js`
- Modify: `src/utils/printKitchenNote.js` (bloque `try { ... window.print ... }` final)
- Modify: `src/utils/printTicket.js` (bloque `try { ... window.print ... }` final)

**Interfaces:**
- Produces: `printHtml(html: string) → Promise<void>` — encadena en una promesa del módulo; cada trabajo pone `html` en `#print-container`, llama `window.print()` y resuelve en el evento `afterprint` (o a los 1500 ms si el navegador no lo dispara). Conserva el fallback actual de `window.open` cuando no existe `#print-container`.
- Consumes: nada.
- `printKitchenNote(order)` y `printTicket(order, config)` mantienen su firma y terminan en `return printHtml(html)`.

- [ ] **Step 1:** Implementar `printHtml` y reemplazar los dos bloques finales por `return printHtml(html)` / `return printHtml(ticketHTML)`.
- [ ] **Step 2:** `npm run build` → "built in".
- [ ] **Step 3: Verificación manual** (Task 9 la repite): llamar en la consola del navegador `printKitchenNote(o); printTicket(o, config)` → salen dos diálogos de impresión, el primero con "COMANDA #", el segundo con el ticket.
- [ ] **Step 4: Commit** — `git commit -m "Imprimir comanda y ticket en cola sin pisarse"`

---

### Task 4: POS usa las reglas (hallazgos 1, 2, 4, 5, 9, 10, 11, 14)

**Files:**
- Modify: `src/components/POS/POSView.jsx` (`handleCheckout` 83-199, `loadOpenAccount` 201-208, `requireShift`)
- Modify: `src/components/POS/CartSidebar.jsx` (descuento 109-111, botones 369-393, `occupiedTables` 50-52)

**Interfaces:**
- Consumes: `planPosAction`, `pendingKitchenItems`, `markItemsSent`, `clampDiscount`, `isTableOccupied` (Task 1); `printHtml` vía `printKitchenNote`/`printTicket` (Task 3); columna `paidAt` (Task 2).

- [ ] **Step 1:** En `handleCheckout`:
  - `const plan = planPosAction(actionType, { isDelivery: !!deliveryInfo, table: tableNumber || null, currentStatus: loadedAccount?.status, hasPending: pendingKitchenItems(cart).length > 0 })`; si `plan.error` → `addToast(plan.error, 'error')` y salir.
  - Un solo camino (sustituye las tres ramas): `items = plan.printKitchen ? markItemsSent(cart) : cart`; `status = plan.status`; si `plan.markPaid` → `paidAt: loadedAccount?.paidAt ?? new Date().toISOString()`; `addOrder` o `updateOrder` según `openAccountId`.
  - Después de guardar: si `plan.printKitchen` → `await printKitchenNote({ ...finalOrder, items: pendingKitchenItems(cart) })`; si `plan.printTicket` → `await printTicket(finalOrder, config)`.
  - Toasts: save "Cuenta guardada ✓", prepare "Comanda enviada a cocina 🍳", checkout "Orden cobrada ✓".
  - Quitar la excepción de "prepare sin turno": todas las acciones requieren `shift` (hallazgo 11).
- [ ] **Step 2:** `loadOpenAccount`: toast `` `Cuenta ${acc.table || '#' + acc.order_number} cargada.` `` (hallazgo 14).
- [ ] **Step 3:** `CartSidebar`:
  - `discountAmount = clampDiscount(discount, subtotal)`.
  - Si `discountAmount > 0`, antes de `executeAction` pedir el PIN del dueño en un mini-modal con `<input type="password" inputMode="numeric">` (mismo estilo que el de borrar en `CajaChicaView`); si no coincide → `addToast('PIN incorrecto', 'error')` y no ejecutar.
  - Botones local: "Guardar" (sin imprimir) solo visible si hay mesa (`tableNumber`); "🍳 Preparar"; "💵 Cobrar". Domicilio: sin cambios de botones.
  - `occupiedTables` usa `isTableOccupied`.
- [ ] **Step 4:** `npm test && npm run build` → PASS / "built in".
- [ ] **Step 5: Commit** — `git commit -m "POS: cobrar manda a cocina e imprime; guardar exige mesa; comanda solo con lo nuevo"`

---

### Task 5: Cocina y repartidor (hallazgos 2, 7, 8)

**Files:**
- Modify: `src/components/Kitchen/KitchenView.jsx` (`handleCleanBacklog` 46-85, `handleReady` 87-108, borrar `useKitchenCount` 9-13 y props `onClose`/`modal`)
- Modify: `src/components/Delivery/DeliveryView.jsx` (`markAsDelivered`)

**Interfaces:**
- Consumes: `kitchenReadyStatus`, `kitchenPrintsTicket`, `deliveredUpdate` (Task 1).

- [ ] **Step 1:** `handleReady(order)`: si `kitchenPrintsTicket(order)` → `printTicket(order, config)` (sin await, para no perder el gesto del usuario); luego `updateOrder(order.id, { status: kitchenReadyStatus(order) })`. Toast según destino: domicilio "Lista para el repartidor 🛵", mesa "Lista para servir", llevar sin cobrar "Lista — cobrar en Envíos / Llevar", cobrada "Orden terminada ✓".
- [ ] **Step 2:** `handleCleanBacklog`: agrupar por `kitchenReadyStatus(order)` y un `bulkUpdateOrders` por grupo; usar `useConfirm` en lugar de `window.confirm`.
- [ ] **Step 3:** Las mesas ya llegan a cocina porque "Preparar" ahora pone `en_preparacion` (Task 4); el filtro "Mesa" existente (`!o.delivery`) las muestra. Verificar que la tarjeta muestre `order.table` cuando existe.
- [ ] **Step 4:** `DeliveryView.markAsDelivered`: `updateOrder(orderId, deliveredUpdate(order, new Date().toISOString()))` (buscar `order` en `orders`).
- [ ] **Step 5:** Borrar `useKitchenCount` y los props `onClose`/`modal` de `KitchenView` (grep previo: `useKitchenCount` y `<KitchenView` solo en `App.jsx` sin props).
- [ ] **Step 6:** `npm test && npm run build`. **Commit** — `git commit -m "Cocina y repartidor respetan el pago; mesas en pantalla de cocina"`

> `DeliveryView.jsx` tiene cambios locales del mapa: stagear solo los hunks de esta tarea (`git add -p`).

---

### Task 6: Mesas y Envíos (hallazgo 6)

**Files:**
- Modify: `src/components/POS/TableMapModal.jsx` (`openOrders` línea 24, `handleDelete`)
- Modify: `src/components/POS/ActiveDeliveriesModal.jsx` (filtro 11-14, `handleDelete` 16-24, etiqueta de estado 95-97)

**Interfaces:**
- Consumes: `isTableOccupied`, `isPaid` (Task 1).

- [ ] **Step 1:** `TableMapModal`: `openOrders = orders.filter(isTableOccupied)`.
- [ ] **Step 2:** Ambos `handleDelete`: en `catch` → `addToast('No se pudo borrar. Solo el dueño puede borrar pedidos que ya están en cocina.', 'error')`.
- [ ] **Step 3:** `ActiveDeliveriesModal`: filtro `(o.status === 'en_preparacion' || o.status === 'listo' || o.status === 'en_camino') && (o.delivery || !o.table)`; junto a la etiqueta de estado mostrar "💵 Pagado" si `isPaid(order)` o "Por cobrar" si no.
- [ ] **Step 4:** `npm run build`. **Commit** — `git commit -m "Mesas y Envíos: ocupación correcta, estado de pago y error al borrar"`

---

### Task 7: Ventas por hora de pago (hallazgo 7)

**Files:**
- Modify: `src/components/Dashboard/DashboardView.jsx` (filtro de ventas ~314-315; agrupación por día ~131, 137, 469-470)
- Modify: `src/components/Costeo/CosteoView.jsx` (~891)

**Interfaces:**
- Consumes: `isPaid`, `paidMs` (Task 1). `calcShiftStats` ya lo usa `TurnoContext` desde Task 1.

- [ ] **Step 1:** Dashboard: "venta" = `isPaid(o)`; rango y día con `isDateInRange('', start, end, paidMs(o))` / `getStandardDateStr('', paidMs(o))`. La columna "estado" del detalle sigue usando `status`.
- [ ] **Step 2:** Costeo: reemplazar `(o.status === 'paid' || o.status === 'entregado')` por `isPaid(o)`.
- [ ] **Step 3:** `npm run build`. **Commit** — `git commit -m "Dashboard y costeo cuentan ventas por hora de pago"`

---

### Task 8: Borrar lo que sobra (hallazgos 12, 13)

**Files:**
- Delete: `src/components/POS/OpenAccountsModal.jsx`, `src/components/POS/DeliveryQueueModal.jsx`, `src/components/Finanzas/` (4 archivos), `src/context/FinanzasContext.jsx`
- Modify: `src/components/Settings/SettingsView.jsx` (borrar `ALL_TABS`, `toggleProtected`, y `protectedTabs`/`pinProtectionEnabled` del estado inicial y de `handleSave`)
- Modify: `src/context/AppContext.jsx` (quitar `protectedTabs` de `DEFAULT_CONFIG`)

- [ ] **Step 1:** Antes de borrar: `grep -rn "OpenAccountsModal\|DeliveryQueueModal\|Finanzas\|protectedTabs\|pinProtectionEnabled\|ALL_TABS" src` → solo deben aparecer las definiciones a borrar.
- [ ] **Step 2:** Borrar con `git rm` y editar los dos archivos.
- [ ] **Step 3:** El mismo grep → sin resultados. `npm test && npm run build` → PASS / "built in".
- [ ] **Step 4: Commit** — `git commit -m "Quitar código sin uso: modales viejos, Finanzas y protección de pestañas"`

---

### Task 9: Verificación de punta a punta

Correr la app (`npm run dev`), con turno abierto y un producto de prueba. Cada escenario anota el `order_number`; al final, borrar los pedidos de prueba como dueño.

- [ ] **A. Llevar, cobrar directo:** Cobrar → 2 impresiones (comanda, luego ticket); aparece en Cocina; Turno suma el total. En Cocina "Listo" → no imprime ticket, sale de la cola, status `paid`.
- [ ] **B. Llevar, preparar y cobrar después:** Preparar → solo comanda. Cocina "Listo" → no imprime, aparece en Envíos / Llevar como "Por cobrar". Cargarla y Cobrar → `paid`, ticket, Turno suma.
- [ ] **C. Mesa:** desde 🗺️ Mesas, agregar 2 tacos → Preparar (comanda con 2 tacos, aparece en Cocina, mesa ocupada). Agregar 1 refresco → Preparar → comanda **solo** con el refresco. Cobrar mientras sigue en cocina → ticket con todo y sigue en Cocina; Cocina "Listo" → status `paid`, mesa libre.
- [ ] **D. Domicilio cobrado al pedir:** Cobrar (Domicilio) → comanda + ticket; Cocina → Listo → aparece al repartidor; Entregado → `paidAt` igual al del cobro.
- [ ] **E. Domicilio por cobrar:** Preparar (Domicilio) → comanda; Cocina Listo → ticket; Entregado → `paidAt` = hora de entrega; Turno lo suma.
- [ ] **F. Guardar sin mesa:** botón Guardar no visible sin mesa.
- [ ] **G. Descuento:** 999 en un pedido de $40 → total $0.00 y descuento $40; pide PIN; PIN incorrecto no cobra.
- [ ] **H. Mesero borra en Envíos un pedido en cocina** → toast de error.
- [ ] **I.** `npm test` PASS y `npm run build` "built in". Push solo después de que el usuario corrió `004_pagado.sql`.
