import React, { useState } from 'react';
import { X, CheckCircle, Bike, UtensilsCrossed, Clock } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { printTicket } from '../../utils/printTicket';
import { useApp } from '../../context/AppContext';

// Exportamos también el conteo para el badge del nav
export function useKitchenCount() {
  const { orders } = useOrders();
  return orders.filter(o => o.status === 'en_preparacion').length;
}

export default function KitchenView({ onClose, modal = false }) {
  const { orders, updateOrder } = useOrders();
  const { addToast } = useToast();
  const { config } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'mesa' | 'delivery'

  const getMs = (t) => {
    if (!t) return 0;
    const n = Number(t);
    return isNaN(n) ? new Date(t).getTime() : n;
  };

  // Órdenes en preparación, ordenadas por llegada (más antiguas primero)
  const kitchenOrders = orders
    .filter(o => o.status === 'en_preparacion')
    .filter(o => {
      if (filter === 'mesa') return !o.delivery;
      if (filter === 'delivery') return !!o.delivery;
      return true;
    })
    .sort((a, b) => getMs(a.timestamp) - getMs(b.timestamp));

  const handleReady = async (order) => {
    try {
      if (order.delivery) {
        await updateOrder(order.id, { status: 'listo' });
        addToast(`Orden lista para el repartidor 🛵`, 'success');
      } else {
        await updateOrder(order.id, { status: 'paid' });
        printTicket(order, config);

        // Registrar en turno activo
        const currentShiftStr = localStorage.getItem('currentShift');
        if (currentShiftStr) {
          const shift = JSON.parse(currentShiftStr);
          shift.orders = (shift.orders || 0) + 1;
          const method = order.paymentMethod || 'Efectivo';
          const deliveryFee = parseFloat(order.delivery?.deliveryFee) || 0;
          const foodTotal = parseFloat(order.total || 0) - deliveryFee;
          
          if (method === 'Efectivo') {
            shift.ventasEfectivo = (shift.ventasEfectivo || 0) + foodTotal;
            if (deliveryFee > 0) shift.enviosEfectivo = (shift.enviosEfectivo || 0) + deliveryFee;
          } else if (method === 'Tarjeta') {
            shift.ventasTarjeta = (shift.ventasTarjeta || 0) + foodTotal;
            if (deliveryFee > 0) shift.enviosTarjeta = (shift.enviosTarjeta || 0) + deliveryFee;
          } else if (method === 'Transferencia') {
            shift.ventasTransferencia = (shift.ventasTransferencia || 0) + foodTotal;
            if (deliveryFee > 0) shift.enviosTransferencia = (shift.enviosTransferencia || 0) + deliveryFee;
          }
          if (deliveryFee > 0) shift.ventasEnvios = (shift.ventasEnvios || 0) + deliveryFee;
          
          localStorage.setItem('currentShift', JSON.stringify(shift));
        }
        addToast(`Orden cobrada y registrada ✓`, 'success');
      }
    } catch (err) {
      console.error(err);
      addToast('Error al actualizar orden', 'error');
    }
  };

  const timeAgo = (timestamp) => {
    const ms = getMs(timestamp);
    if (!ms) return '';
    const diff = Math.floor((Date.now() - ms) / 60000);
    if (diff < 1) return 'ahora';
    if (diff === 1) return '1 min';
    return `${diff} min`;
  };

  const urgencyColor = (timestamp) => {
    const ms = getMs(timestamp);
    const diff = Math.floor((Date.now() - (ms || Date.now())) / 60000);
    if (diff >= 15) return '#f44336';
    if (diff >= 8)  return '#FF9800';
    return '#4CAF50';
  };

  // ── Header compartido ──────────────────────────────────────────────────────
  const header = (
    <div style={{
      background: '#1a1a2e', color: 'white',
      padding: '14px 20px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0, borderRadius: modal ? '0' : '16px 16px 0 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <UtensilsCrossed size={22} color="#FF9800" />
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Módulo de Cocina</h2>
        <span style={{
          background: kitchenOrders.length > 0 ? '#FF9800' : 'rgba(255,255,255,0.15)',
          color: 'white', borderRadius: '12px', padding: '2px 10px',
          fontSize: '0.85rem', fontWeight: 'bold',
        }}>
          {kitchenOrders.length} en preparación
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {['all', 'mesa', 'delivery'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 12px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
            background: filter === f ? '#FF9800' : 'rgba(255,255,255,0.1)',
            color: 'white',
          }}>
            {f === 'all' ? '📋 Todos' : f === 'mesa' ? '🪑 Mesa' : '🛵 Delivery'}
          </button>
        ))}
        {modal && onClose && (
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
            cursor: 'pointer', borderRadius: '50%', width: '34px', height: '34px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );

  // ── Grid de órdenes ────────────────────────────────────────────────────────
  const grid = (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '16px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '14px', alignContent: 'start',
    }}>
      {kitchenOrders.length === 0 ? (
        <div style={{ gridColumn: '1/-1', textAlign: 'center', paddingTop: '60px', color: modal ? 'white' : 'var(--text-light)' }}>
          <UtensilsCrossed size={56} style={{ opacity: 0.25, marginBottom: '14px' }} />
          <h3 style={{ opacity: 0.5, margin: 0 }}>Sin órdenes en preparación</h3>
          <p style={{ opacity: 0.3, marginTop: '6px' }}>Las nuevas órdenes aparecerán aquí en tiempo real</p>
        </div>
      ) : (
        kitchenOrders.map(order => (
          <div key={order.id} style={{
            background: 'white', borderRadius: '14px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            borderLeft: `5px solid ${urgencyColor(order.timestamp)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          }}>
            {/* Card header */}
            <div style={{
              padding: '10px 14px',
              background: order.delivery ? '#FFF3E0' : '#E8F5E9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {order.delivery
                  ? <Bike size={16} color="#E65100" />
                  : <UtensilsCrossed size={16} color="#2E7D32" />}
                {order.table && <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>{order.table}</span>}
                {order.mesero && <span style={{ fontSize: '0.78rem', color: '#666' }}>• {order.mesero}</span>}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.8rem', color: urgencyColor(order.timestamp), fontWeight: 'bold',
              }}>
                <Clock size={13} />
                {timeAgo(order.timestamp)}
              </div>
            </div>

            {/* Delivery info */}
            {order.delivery && (
              <div style={{ padding: '6px 14px', background: '#FFF8E1', fontSize: '0.8rem', borderBottom: '1px solid #FFE082' }}>
                <div style={{ fontWeight: 'bold', color: '#E65100', marginBottom: '2px' }}>🛵 Domicilio</div>
                {order.delivery.clientName && <div>👤 {order.delivery.clientName}</div>}
                {order.delivery.colonia && (
                  <div>📍 {order.delivery.colonia}, {order.delivery.calle} {order.delivery.numero && `#${order.delivery.numero}`}</div>
                )}
                {order.delivery.phone && (
                  <a href={`tel:${order.delivery.phone}`} style={{ color: '#1565C0', textDecoration: 'none', fontWeight: 'bold' }}>
                    📞 {order.delivery.phone}
                  </a>
                )}
              </div>
            )}

            {/* Items */}
            <div style={{ padding: '10px 14px', flex: 1 }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: '8px', padding: '3px 0',
                  borderBottom: '1px dashed #eee',
                }}>
                  <span style={{ fontWeight: '900', fontSize: '1.05rem', minWidth: '26px', color: '#333' }}>
                    {item.quantity}x
                  </span>
                  <span style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>
                    {item.name}
                    {item.persona && <em style={{ color: '#888', fontWeight: 'normal', fontSize: '0.78rem' }}> ({item.persona})</em>}
                  </span>
                </div>
              ))}
              {order.note && (
                <div style={{
                  marginTop: '6px', padding: '5px 8px', background: '#FFFDE7',
                  borderRadius: '6px', fontSize: '0.8rem', border: '1px dashed #FDD835',
                }}>
                  ⚠ {order.note}
                </div>
              )}
            </div>

            {/* Action button */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #eee' }}>
              {order.delivery ? (
                <button onClick={() => handleReady(order)} style={{
                  width: '100%', background: '#FF9800', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '11px', fontWeight: 'bold',
                  fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <CheckCircle size={18} /> Listo → Avisar Repartidor
                </button>
              ) : (
                <button onClick={() => handleReady(order)} style={{
                  width: '100%', background: '#4CAF50', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '11px', fontWeight: 'bold',
                  fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <CheckCircle size={18} /> Listo → Cobrar e Imprimir
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── Modo modal (overlay) ───────────────────────────────────────────────────
  if (modal) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2500,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column',
      }}>
        {header}
        {grid}
      </div>
    );
  }

  // ── Modo página completa (tab del admin) ───────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-color)', borderRadius: '16px', overflow: 'hidden',
    }}>
      {header}
      {grid}
    </div>
  );
}
