import React, { useState } from 'react';
import { X, CheckCircle, Bike, UtensilsCrossed, Clock } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';
import { printTicket } from '../../utils/printTicket';
import { useApp } from '../../context/AppContext';

export default function KitchenView({ onClose }) {
  const { orders, updateOrder } = useOrders();
  const { addToast } = useToast();
  const { config } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'mesa' | 'delivery'

  // Órdenes en preparación (tanto mesa como delivery)
  const kitchenOrders = orders
    .filter(o => o.status === 'en_preparacion')
    .filter(o => {
      if (filter === 'mesa') return !o.delivery;
      if (filter === 'delivery') return !!o.delivery;
      return true;
    })
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); // más viejos primero

  const handleReady = async (order) => {
    try {
      if (order.delivery) {
        // Delivery: marcar como "listo" → llega al repartidor
        await updateOrder(order.id, { status: 'listo' });
        addToast(`Orden lista para el repartidor 🛵`, 'success');
      } else {
        // Mesa: cobrar → imprimir ticket cliente
        await updateOrder(order.id, { status: 'paid' });
        printTicket(order, config);

        // Registrar en el turno activo
        const currentShiftStr = localStorage.getItem('currentShift');
        if (currentShiftStr) {
          const shift = JSON.parse(currentShiftStr);
          shift.orders = (shift.orders || 0) + 1;
          const method = order.paymentMethod || 'Efectivo';
          if (method === 'Efectivo') shift.ventasEfectivo = (shift.ventasEfectivo || 0) + (order.total || 0);
          else if (method === 'Tarjeta') shift.ventasTarjeta = (shift.ventasTarjeta || 0) + (order.total || 0);
          else if (method === 'Transferencia') shift.ventasTransferencia = (shift.ventasTransferencia || 0) + (order.total || 0);
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
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff < 1) return 'ahora mismo';
    if (diff === 1) return 'hace 1 min';
    return `hace ${diff} min`;
  };

  const urgencyColor = (timestamp) => {
    const diff = Math.floor((Date.now() - (timestamp || Date.now())) / 60000);
    if (diff >= 15) return '#f44336'; // rojo: urgente
    if (diff >= 8) return '#FF9800';  // naranja: pronto
    return '#4CAF50';                  // verde: ok
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2500, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UtensilsCrossed size={24} color="#FF9800" />
          <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Módulo de Cocina</h2>
          <span style={{ background: '#FF9800', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            {kitchenOrders.length} en preparación
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filter tabs */}
          {['all', 'mesa', 'delivery'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', background: filter === f ? '#FF9800' : 'rgba(255,255,255,0.1)', color: 'white' }}>
              {f === 'all' ? '📋 Todos' : f === 'mesa' ? '🪑 Mesa' : '🛵 Delivery'}
            </button>
          ))}
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Grid de órdenes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', alignContent: 'start' }}>
        {kitchenOrders.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'white', paddingTop: '60px' }}>
            <UtensilsCrossed size={60} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{ opacity: 0.5 }}>No hay órdenes en preparación</h3>
            <p style={{ opacity: 0.3 }}>Las órdenes nuevas aparecerán aquí automáticamente</p>
          </div>
        ) : (
          kitchenOrders.map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderLeft: `5px solid ${urgencyColor(order.timestamp)}` }}>
              {/* Card header */}
              <div style={{ padding: '12px 14px', background: order.delivery ? '#FFF3E0' : '#E8F5E9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {order.delivery ? <Bike size={18} color="#E65100" /> : <UtensilsCrossed size={18} color="#2E7D32" />}
                  <strong style={{ fontSize: '1.05rem' }}>#{order.id}</strong>
                  {order.table && <span style={{ fontSize: '0.82rem', color: '#555' }}>• {order.table}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: urgencyColor(order.timestamp), fontWeight: 'bold' }}>
                  <Clock size={13} />
                  {timeAgo(order.timestamp)}
                </div>
              </div>

              {/* Delivery info */}
              {order.delivery && (
                <div style={{ padding: '8px 14px', background: '#FFF8E1', fontSize: '0.82rem', borderBottom: '1px solid #FFE082' }}>
                  <div style={{ fontWeight: 'bold', color: '#E65100', marginBottom: '2px' }}>🛵 Domicilio</div>
                  {order.delivery.colonia && <div>📍 {order.delivery.colonia}, {order.delivery.calle} {order.delivery.numero && `#${order.delivery.numero}`}</div>}
                  {order.delivery.clientName && <div>👤 {order.delivery.clientName}</div>}
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
                  <div key={idx} style={{ display: 'flex', gap: '8px', padding: '4px 0', borderBottom: '1px dashed #eee' }}>
                    <span style={{ fontWeight: '900', fontSize: '1.1rem', minWidth: '28px', color: '#333' }}>{item.quantity}x</span>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {item.name}
                      {item.persona && <em style={{ color: '#888', fontWeight: 'normal', fontSize: '0.8rem' }}> ({item.persona})</em>}
                    </span>
                  </div>
                ))}
                {order.note && (
                  <div style={{ marginTop: '8px', padding: '6px 8px', background: '#FFFDE7', borderRadius: '6px', fontSize: '0.82rem', border: '1px dashed #FDD835' }}>
                    ⚠ {order.note}
                  </div>
                )}
              </div>

              {/* Action button */}
              <div style={{ padding: '12px 14px', borderTop: '1px solid #eee' }}>
                {order.delivery ? (
                  <button onClick={() => handleReady(order)} style={{ width: '100%', background: '#FF9800', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={20} /> Listo → Avisar Repartidor
                  </button>
                ) : (
                  <button onClick={() => handleReady(order)} style={{ width: '100%', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle size={20} /> Listo → Cobrar e Imprimir
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
