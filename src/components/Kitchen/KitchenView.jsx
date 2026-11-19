import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Bike, UtensilsCrossed, Clock } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useToast, useConfirm } from '../../context/ToastContext';
import { kitchenReadyStatus, kitchenPrintsTicket } from '../../utils/orderFlow';
import { printTicket } from '../../utils/printTicket';
import { useApp } from '../../context/AppContext';
import { playChime } from '../../utils/playChime';

export default function KitchenView() {
  const { orders, updateOrder, bulkUpdateOrders } = useOrders();
  const { addToast } = useToast();
  const showConfirm = useConfirm();
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

  // Sonido de alerta de nueva comanda
  const prevKitchenCount = useRef(kitchenOrders.length);
  useEffect(() => {
    if (kitchenOrders.length > prevKitchenCount.current) {
      playChime();
    }
    prevKitchenCount.current = kitchenOrders.length;
  }, [kitchenOrders.length]);

  const handleCleanBacklog = async () => {
    const ordersToClean = kitchenOrders;
    if (ordersToClean.length === 0) {
      addToast('No hay órdenes estancadas en la cocina.', 'info');
      return;
    }

    const confirmClean = await showConfirm(`¿Marcar las ${ordersToClean.length} órdenes de la cocina como listas?`);
    if (!confirmClean) return;

    try {
      // Un update por estado destino (listo / paid / open), según si es domicilio, mesa y si ya se cobró.
      const byStatus = {};
      ordersToClean.forEach(order => {
        const next = kitchenReadyStatus(order);
        (byStatus[next] ||= []).push(order.id);
      });
      for (const [status, ids] of Object.entries(byStatus)) {
        await bulkUpdateOrders(ids, { status });
      }
      addToast(`Se marcaron ${ordersToClean.length} órdenes como listas ✓`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Error al limpiar la cola de cocina', 'error');
    }
  };

  const handleReady = async (order) => {
    // Solo domicilios por cobrar llevan ticket desde cocina; los demás lo recibieron (o recibirán) al cobrar.
    if (kitchenPrintsTicket(order)) printTicket(order, config);

    const next = kitchenReadyStatus(order);
    try {
      await updateOrder(order.id, { status: next });
      const msg = order.delivery ? 'Lista para el repartidor 🛵'
        : next === 'paid' ? 'Orden terminada ✓'
        : next === 'open' ? 'Lista para servir 🍽️'
        : 'Lista — cobrar en Envíos / Llevar';
      addToast(msg, 'success');
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
      flexShrink: 0, borderRadius: '16px 16px 0 0',
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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
        
        {kitchenOrders.length > 0 && (
          <button onClick={handleCleanBacklog} style={{
            padding: '5px 12px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
            background: '#d32f2f',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🧹 Limpiar Cocina ({kitchenOrders.length})
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
        <div style={{ gridColumn: '1/-1', textAlign: 'center', paddingTop: '60px', color: 'var(--text-light)' }}>
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
                <span style={{ fontWeight: '900', fontSize: '0.95rem', background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: '6px' }}>
                  #{order.order_number || (typeof order.id === 'string' ? order.id.substring(0, 4) : order.id)}
                </span>
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
