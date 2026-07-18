import React from 'react';
import { X, Clock, User, ClipboardList, PlusCircle, Trash2 } from 'lucide-react';
import { useOrders } from '../../context/OrdersContext';
import { useApp } from '../../context/AppContext';
import { useConfirm } from '../../context/ToastContext';

export default function TableMapModal({ onClose, onLoadAccount, onStartNewOrder }) {
  const { orders, deleteOrder } = useOrders();
  const { config } = useApp();
  const showConfirm = useConfirm();

  const handleDeleteOrder = async (e, id) => {
    e.stopPropagation(); // Evitar que abra la cuenta al dar clic al botón de borrar
    const confirmed = await showConfirm('¿Seguro que deseas eliminar esta cuenta sin cobrarla?');
    if (!confirmed) return;
    try {
      await deleteOrder(id);
    } catch (err) {
      console.error('Error al eliminar orden:', err);
    }
  };

  // Active open orders
  const openOrders = orders.filter(o => o.status === 'open');

  // Find if a table has an active order
  const getTableOrder = (tableName) => {
    return openOrders.find(o => o.table === tableName);
  };

  const tables = config?.tables || [];
  const occupiedCount = tables.filter(t => !!getTableOrder(t.name)).length;
  const freeCount = tables.length - occupiedCount;

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
        maxWidth: '850px',
        height: '85vh',
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
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗺️ Plano de Mesas
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.8rem', fontWeight: '700' }}>
              <span style={{ color: '#27ae60', background: 'rgba(39, 174, 96, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                🟢 {freeCount} Libres
              </span>
              <span style={{ color: '#e67e22', background: 'rgba(230, 126, 34, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                🟠 {occupiedCount} Ocupadas
              </span>
            </div>
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
            color: '#64748b',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Layout Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tables Map Section */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '800' }}>
              🪑 Mesas del Local
            </h3>
            
            {tables.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(0,0,0,0.01)',
                border: '2px dashed rgba(0,0,0,0.1)',
                borderRadius: '16px'
              }}>
                <ClipboardList size={40} style={{ color: '#94a3b8', marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>No tienes mesas configuradas aún.</p>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>Agrégalas en <strong>⚙️ Configuración</strong>.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '16px'
              }}>
                {tables.map(t => {
                  const activeOrder = getTableOrder(t.name);
                  const isOccupied = !!activeOrder;
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (isOccupied) {
                          onLoadAccount(activeOrder);
                        } else {
                          onStartNewOrder(t.name);
                        }
                      }}
                      style={{
                        height: '130px',
                        borderRadius: '16px',
                        border: isOccupied ? '2px solid #ff9f43' : '2px dashed rgba(39, 174, 96, 0.4)',
                        background: isOccupied 
                          ? 'linear-gradient(135deg, rgba(255, 159, 67, 0.08), rgba(255, 107, 107, 0.08))' 
                          : 'rgba(255, 255, 255, 1)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '16px',
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        position: 'relative',
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: isOccupied ? '0 4px 12px rgba(255, 159, 67, 0.1)' : 'none'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        if (!isOccupied) {
                          e.currentTarget.style.background = 'rgba(39, 174, 96, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(39, 174, 96, 0.8)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (!isOccupied) {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = 'rgba(39, 174, 96, 0.4)';
                        }
                      }}
                    >
                      {/* Top row */}
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '1.05rem',
                          color: isOccupied ? '#e67e22' : '#27ae60'
                        }}>
                          {t.name}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '3px 8px',
                          borderRadius: '20px',
                          background: isOccupied ? '#ff9f43' : '#27ae60',
                          color: '#ffffff',
                          textTransform: 'uppercase'
                        }}>
                          {isOccupied ? 'Ocupada' : 'Libre'}
                        </span>
                      </div>

                      {/* Middle row info */}
                      {isOccupied ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#d35400' }}>
                              ${activeOrder.total?.toFixed(2) || '0.00'}
                            </span>
                            <button
                              onClick={(e) => handleDeleteOrder(e, activeOrder.id)}
                              style={{
                                background: 'rgba(255, 0, 0, 0.05)',
                                border: '1px solid rgba(255, 0, 0, 0.1)',
                                borderRadius: '8px',
                                padding: '6px',
                                color: '#ff6b6b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 0, 0, 0.05)'}
                              title="Eliminar Cuenta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {activeOrder.time}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.78rem', fontWeight: '600' }}>
                          <PlusCircle size={14} /> Nueva orden
                        </div>
                      )}

                      {/* Waiter signature if assigned */}
                      {isOccupied && activeOrder.mesero && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          background: 'rgba(0,0,0,0.04)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          alignSelf: 'flex-end',
                          fontWeight: '600'
                        }}>
                          <User size={10} /> {activeOrder.mesero}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
              color: '#64748b',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
              e.currentTarget.style.color = '#1e293b';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}
