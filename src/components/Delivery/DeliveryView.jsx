import React, { useEffect, useRef } from 'react';
import { useOrders } from '../../context/OrdersContext';
import { MapPin, CheckCircle2, Navigation, LogOut, RefreshCw } from 'lucide-react';
import { useToast, useConfirm } from '../../context/ToastContext';
import { playChime } from '../../utils/playChime';

export default function DeliveryView({ onLogout }) {
  const { orders, updateOrder } = useOrders();
  const { addToast } = useToast();
  const showConfirm = useConfirm();

  // Filtrar pedidos que están "listos" o "en_camino" (sin requerir dirección fija)
  const deliveryOrders = orders.filter(
    o => o.delivery && (o.status === 'listo' || o.status === 'en_camino')
  );

  // Sonido de alerta de pedido listo para repartidor
  const prevDeliveryCount = useRef(deliveryOrders.length);
  useEffect(() => {
    if (deliveryOrders.length > prevDeliveryCount.current) {
      playChime();
    }
    prevDeliveryCount.current = deliveryOrders.length;
  }, [deliveryOrders.length]);

  const startRoute = async (order) => {
    // Si estaba listo, lo marcamos como en camino
    if (order.status === 'listo') {
      try {
        await updateOrder(order.id, { status: 'en_camino' });
        addToast('Pedido marcado en camino', 'success');
      } catch (err) {
        addToast('Error al actualizar', 'error');
      }
    }
    
    // Construir dirección robusta para Google Maps
    const addressStr = order.delivery.address || 
      `${order.delivery.calle || ''} ${order.delivery.numero || ''}, ${order.delivery.colonia || ''}`.trim();
    const destino = encodeURIComponent(addressStr);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const markAsDelivered = async (orderId) => {
    const confirmed = await showConfirm('¿Confirmar entrega completada?');
    if (!confirmed) return;
    try {
      await updateOrder(orderId, { status: 'entregado' });
      addToast('Pedido entregado con éxito', 'success');
    } catch (err) {
      addToast('Error al confirmar', 'error');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>
          🛵 Pedidos
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => window.location.reload()} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)', fontWeight: 'bold' }}
          >
            <RefreshCw size={18} /> Recargar
          </button>
          <button onClick={onLogout} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-light)', fontWeight: 'bold' }}>
            <LogOut size={18} /> Salir
          </button>
        </div>
      </div>

      {deliveryOrders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
          <MapPin size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
          <h3>No hay pedidos pendientes</h3>
          <p>Los pedidos listos aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {deliveryOrders.map(order => (
            <div key={order.id} className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: order.status === 'en_camino' ? '4px solid #4CAF50' : '4px solid #FF9800' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Orden #{order.order_number || order.id}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{order.time}</span>
                </div>
                <div style={{ background: order.status === 'listo' ? '#FFF3E0' : '#E8F5E9', color: order.status === 'listo' ? '#E65100' : '#2E7D32', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {order.status === 'listo' ? 'Listo para ruta' : 'En camino'}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.delivery.clientName && (
                  <p style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    👤 {order.delivery.clientName}
                  </p>
                )}
                <p style={{ margin: 0, fontSize: '0.9rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <MapPin size={16} color="var(--primary-color)" />
                  <strong>{order.delivery.address || `${order.delivery.calle || ''} ${order.delivery.numero ? '#'+order.delivery.numero : ''}`.trim()}</strong>
                </p>
                {order.delivery.colonia && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', paddingLeft: '22px' }}>
                    {order.delivery.colonia}
                  </p>
                )}
                {order.delivery.phone && (
                  <a
                    href={`tel:${order.delivery.phone}`}
                    style={{ margin: 0, fontSize: '1rem', color: '#1565C0', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#E3F2FD', borderRadius: '8px', marginTop: '4px' }}
                  >
                    📞 {order.delivery.phone} — Toca para llamar
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  A cobrar: ${(order.total || 0).toFixed(2)}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => startRoute(order)}
                    className="btn-primary" 
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' }}
                  >
                    <Navigation size={16} /> Ruta
                  </button>
                  
                  {order.status === 'en_camino' && (
                    <button 
                      onClick={() => markAsDelivered(order.id)}
                      style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <CheckCircle2 size={16} /> Entregado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
