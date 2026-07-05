import React from 'react';
import { X, Bike, CheckCircle } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useToast } from '../../context/ToastContext';

export default function DeliveryQueueModal({ onClose }) {
  const { orders, updateOrder } = useOrders();
  const { addToast } = useToast();

  const activeDeliveries = orders.filter(
    o => o.delivery && o.status === 'en_preparacion'
  );

  const markAsReady = async (id) => {
    try {
      await updateOrder(id, { status: 'listo' });
      addToast(`Orden #${id} lista para repartidor`, 'success');
    } catch (error) {
      addToast('Error al actualizar la orden', 'error');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ background: 'white', padding: '24px', borderRadius: '20px', width: '500px', maxWidth: '90vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bike size={24} color="var(--primary-color)" /> Pedidos en Preparación
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeDeliveries.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '40px' }}>
              No hay pedidos de delivery en preparación.
            </p>
          ) : (
            activeDeliveries.map(order => (
              <div key={order.id} style={{ border: '1px solid rgba(0,0,0,0.1)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Orden #{order.id}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    📍 {order.delivery.address || `${order.delivery.calle || ''} ${order.delivery.numero || ''}`.trim()} {order.delivery.colonia && `(${order.delivery.colonia})`}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    A cobrar: ${(order.total || 0).toFixed(2)}
                  </p>
                </div>
                <button 
                  onClick={() => markAsReady(order.id)}
                  style={{ background: 'var(--success-color)', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <CheckCircle size={18} /> Listo
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
