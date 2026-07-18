import React from 'react';
import { X, Clock, Bike, ShoppingBag, Edit2, Trash2 } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useConfirm } from '../../context/ToastContext';

export default function ActiveDeliveriesModal({ onClose, onLoadAccount }) {
  const { orders, deleteOrder } = useOrders();
  const showConfirm = useConfirm();

  // Filter orders that are preparing or ready and are delivery or carryout (no table)
  const activeOrders = orders.filter(o => 
    (o.status === 'en_preparacion' || o.status === 'listo') && 
    (o.delivery || !o.table)
  );

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const confirmed = await showConfirm('¿Seguro que deseas eliminar este pedido activo?');
    if (!confirmed) return;
    try {
      await deleteOrder(id);
    } catch (err) {
      console.error('Error al eliminar orden activa:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 4000,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(248, 250, 252, 0.8)',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛵 Envíos y Llevar Activos
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
              Carga un pedido de regreso al POS para agregarle cosas o editarlo
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.04)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable List */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Bike size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>No hay envíos ni pedidos para llevar activos en preparación.</p>
            </div>
          ) : (
            activeOrders.map(order => {
              const isDelivery = !!order.delivery;
              const statusLabel = order.status === 'en_preparacion' ? '🍳 En Cocina' : '✓ Listo';
              const statusColor = order.status === 'en_preparacion' ? '#e67e22' : '#27ae60';
              const statusBg = order.status === 'en_preparacion' ? 'rgba(230, 126, 34, 0.1)' : 'rgba(39, 174, 96, 0.1)';

              return (
                <div
                  key={order.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(248, 250, 252, 0.6)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  {/* Left: Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isDelivery ? <Bike size={16} color="#6c5ce7" /> : <ShoppingBag size={16} color="#e67e22" />}
                        {isDelivery ? `Envío #${order.order_number}` : `Llevar #${order.order_number}`}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: statusBg,
                        color: statusColor,
                        textTransform: 'uppercase'
                      }}>
                        {statusLabel}
                      </span>
                    </div>

                    {isDelivery && order.delivery?.colonia && (
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                        📍 {order.delivery.colonia} {order.delivery.calle ? `- ${order.delivery.calle}` : ''}
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {order.time}
                    </span>

                    {/* Items summary */}
                    <div style={{
                      fontSize: '0.78rem',
                      color: '#475569',
                      marginTop: '6px',
                      background: 'rgba(0,0,0,0.02)',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '6px' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#1e293b' }}>
                        ${order.total?.toFixed(2) || '0.00'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' }}>
                        {order.items?.reduce((s,i) => s + i.quantity, 0)} arts
                      </span>
                    </div>

                    <button
                      onClick={() => onLoadAccount(order)}
                      style={{
                        background: '#6c5ce7',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <Edit2 size={14} /> Editar
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, order.id)}
                      style={{
                        background: 'rgba(255, 0, 0, 0.05)',
                        border: '1px solid rgba(255, 0, 0, 0.1)',
                        borderRadius: '10px',
                        padding: '10px',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.05)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(248, 250, 252, 0.8)',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,0,0,0.12)',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '700',
              color: '#64748b'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
