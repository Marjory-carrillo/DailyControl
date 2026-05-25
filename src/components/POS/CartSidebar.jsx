import React, { useState } from 'react';
import { Trash2, Plus, Minus, Printer, Tag, Bike, MapPin, Phone, UserCircle2, X, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

export default function CartSidebar({ cart, updateQuantity, removeFromCart, onCheckout, loadedAccount, onCloseAccount, fullHeight, activePersona, onSetActivePersona }) {
  const { config, meseros } = useApp();
  const showToast = useToast();
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [tableNumber, setTableNumber] = useState('');
  
  // Delivery state
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryCalle, setDeliveryCalle] = useState('');
  const [deliveryNumero, setDeliveryNumero] = useState('');
  const [deliveryColonia, setDeliveryColonia] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');

  // Track occupied tables
  const [occupiedTables, setOccupiedTables] = useState([]);

  React.useEffect(() => {
    const accs = JSON.parse(localStorage.getItem('openAccounts') || '[]');
    setOccupiedTables(accs.map(a => a.table).filter(Boolean));
  }, [loadedAccount, cart.length]);

  React.useEffect(() => {
    if (loadedAccount) {
      setNote(loadedAccount.note || '');
      setDiscount(loadedAccount.discount || '');
      setPaymentMethod(loadedAccount.paymentMethod || 'Efectivo');
      setTableNumber(loadedAccount.table || '');
      setIsDelivery(false);
    }
  }, [loadedAccount]);

  React.useEffect(() => {
    if (cart.length === 0) {
      setNote(''); setDiscount(''); setPaymentMethod('Efectivo');
      setTableNumber(''); setIsDelivery(false);
      setDeliveryCalle(''); setDeliveryNumero(''); setDeliveryColonia(''); setDeliveryPhone('');
      if (onSetActivePersona) onSetActivePersona('');
    }
  }, [cart.length]);

  // Waiter modal state
  const [showMeseroModal, setShowMeseroModal] = useState(false);
  const [selectedMesero, setSelectedMesero] = useState(null);
  const [meseroPin, setMeseroPin] = useState('');
  const [actionType, setActionType] = useState('checkout');

  const handleAction = (type) => {
    executeAction(type, null);
  };

  const executeAction = (type, meseroName) => {
    const deliveryInfo = isDelivery ? { colonia: deliveryColonia, calle: deliveryCalle, numero: deliveryNumero, phone: deliveryPhone } : null;
    onCheckout(note, discountAmount, total, paymentMethod, deliveryInfo, meseroName, isDelivery ? null : tableNumber, type);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // Get unique sub-order numbers from cart
  const subOrders = [...new Set(cart.map(i => i.persona).filter(Boolean))].sort();
  const hasMultipleOrders = subOrders.length > 0;

  // Totals per sub-order
  const subOrderTotals = {};
  cart.forEach(item => {
    const key = item.persona || 'Orden 1';
    subOrderTotals[key] = (subOrderTotals[key] || 0) + item.price * item.quantity;
  });

  // How many sub-orders exist (including the default)
  const maxOrderNum = subOrders.length > 0
    ? Math.max(...subOrders.map(s => parseInt(s.replace('Orden ', '')) || 1))
    : 1;

  const addSubOrder = () => {
    const next = `Orden ${maxOrderNum + 1}`;
    if (onSetActivePersona) onSetActivePersona(next);
  };

  const setActive = (p) => {
    if (onSetActivePersona) onSetActivePersona(p);
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '9px 12px',
    borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
    fontSize: '0.88rem', color: 'var(--text-dark)', outline: 'none',
  };

  // Group cart items by sub-order for display
  const groupedByOrder = {};
  cart.forEach(item => {
    const key = item.persona || 'Orden 1';
    if (!groupedByOrder[key]) groupedByOrder[key] = [];
    groupedByOrder[key].push(item);
  });
  const orderKeys = Object.keys(groupedByOrder).sort();

  return (
    <div className="glass-panel" style={{ width: fullHeight ? '100%' : '360px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: fullHeight ? '14px 16px' : '20px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: fullHeight ? '1.15rem' : '1.5rem' }}>
          {loadedAccount ? `Mesa ${loadedAccount.table || loadedAccount.id}` : 'Nueva Orden'}
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Add sub-order button */}
          <button onClick={addSubOrder} title="Agregar otra orden a esta cuenta"
            style={{
              background: '#6c5ce7', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem',
              padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontFamily: 'inherit',
            }}>
            <Plus size={14} /> Orden
          </button>
          {loadedAccount && (
            <button onClick={onCloseAccount} style={{ background: 'rgba(0,0,0,0.05)', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold' }}>
              <X size={16} /> Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Sub-order tabs (only show when there are 2+) */}
      {hasMultipleOrders && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(108,92,231,0.04)', display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: '600', flexShrink: 0 }}>Agregando a:</span>
          <button onClick={() => setActive('')} style={{
            padding: '6px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: '700', fontSize: '0.82rem',
            background: !activePersona ? '#6c5ce7' : 'rgba(0,0,0,0.06)',
            color: !activePersona ? 'white' : '#555',
          }}>Orden 1</button>
          {subOrders.map(s => (
            <button key={s} onClick={() => setActive(s)} style={{
              padding: '6px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: '700', fontSize: '0.82rem',
              background: activePersona === s ? '#6c5ce7' : 'rgba(0,0,0,0.06)',
              color: activePersona === s ? 'white' : '#555',
            }}>{s}</button>
          ))}
        </div>
      )}

      {/* Cart items — grouped */}
      <div style={{ flex: 1, overflowY: 'auto', padding: fullHeight ? '10px 16px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cart.length === 0 ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '50px' }}>
            Agrega productos a la orden
          </p>
        ) : hasMultipleOrders ? (
          // Grouped display
          orderKeys.map(orderKey => (
            <div key={orderKey}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '2px solid #6c5ce7', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#6c5ce7' }}>{orderKey}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#555' }}>${(subOrderTotals[orderKey] || 0).toFixed(2)}</span>
              </div>
              {groupedByOrder[orderKey].map(item => (
                <CartItem key={`${item.id}-${item.persona || ''}`} item={item} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
              ))}
            </div>
          ))
        ) : (
          // Simple flat display
          cart.map(item => (
            <CartItem key={`${item.id}-${item.persona || ''}`} item={item} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: fullHeight ? '10px 16px' : '14px 20px', borderTop: 'var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Notes */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>📝 Nota (opcional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej: sin cebolla, extra chile..." style={inputStyle} />
        </div>

        {/* Discount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={15} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
          <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="Descuento $0.00" min="0" style={{ ...inputStyle, flex: 1 }} />
        </div>

        {discountAmount > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 0', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontSize: '0.9rem' }}>
              <span>Descuento</span><span>- ${discountAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 'bold', paddingTop: '2px' }}>
          <span>Total:</span>
          <span style={{ color: 'var(--primary-color)' }}>${total.toFixed(2)}</span>
        </div>

        {/* Payment */}
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Método de Pago</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
              <button key={method} onClick={() => setPaymentMethod(method)} style={{
                flex: 1, padding: '8px 0', fontSize: '0.78rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
                background: paymentMethod === method ? 'var(--primary-color)' : 'transparent',
                color: paymentMethod === method ? 'white' : 'var(--text-dark)',
                border: paymentMethod === method ? 'none' : '1px solid rgba(0,0,0,0.1)',
              }}>{method}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        {!isDelivery && (
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>🪑 Mesa (opcional)</label>
            {config?.tables && config.tables.length > 0 ? (
              <select value={tableNumber} onChange={e => setTableNumber(e.target.value)} style={inputStyle}>
                <option value="">Seleccionar Mesa...</option>
                {config.tables.map(t => {
                  const isOccupied = occupiedTables.includes(t.name);
                  const isThis = loadedAccount && loadedAccount.table === t.name;
                  return <option key={t.id} value={t.name} disabled={isOccupied && !isThis}>{t.name}{isOccupied && !isThis ? ' (Ocupada)' : ''}</option>;
                })}
              </select>
            ) : (
              <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ej: Mesa 4" style={inputStyle} />
            )}
          </div>
        )}

        {/* Delivery */}
        {config?.deliveryEnabled && (
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-dark)', marginBottom: isDelivery ? '10px' : '0', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <Bike size={18} color="var(--primary-color)" /> Domicilio
            </label>
            {isDelivery && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} color="var(--text-light)" />
                  <input value={deliveryColonia} onChange={e => setDeliveryColonia(e.target.value)} placeholder="Colonia..." style={{ ...inputStyle, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '23px' }}>
                  <input value={deliveryCalle} onChange={e => setDeliveryCalle(e.target.value)} placeholder="Calle..." style={{ ...inputStyle, flex: 2 }} />
                  <input value={deliveryNumero} onChange={e => setDeliveryNumero(e.target.value)} placeholder="No..." style={{ ...inputStyle, flex: 1 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="var(--text-light)" />
                  <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="Teléfono" style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isDelivery ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--warning-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '14px', fontSize: '0.92rem' }}
              disabled={cart.length === 0} onClick={() => handleAction('save')}>Guardar</button>
            <button className="btn-primary" style={{ flex: 1, background: 'var(--success-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '14px', fontSize: '0.92rem' }}
              disabled={cart.length === 0} onClick={() => handleAction('checkout')}>Cobrar</button>
          </div>
        ) : (
          <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '14px', fontSize: '1rem' }}
            disabled={cart.length === 0 || (!deliveryCalle.trim() || !deliveryColonia.trim())} onClick={() => handleAction('checkout')}>
            <Printer size={20} /> Cobrar (Domicilio)
          </button>
        )}
      </div>

      {/* Mesero PIN Modal */}
      {showMeseroModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ background: 'white', padding: '24px', borderRadius: '20px', width: '340px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, textAlign: 'center', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <UserCircle2 size={22} color="var(--primary-color)" /> Autorizar
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center' }}>Selecciona tu perfil e ingresa tu PIN.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {meseros.map(m => (
                <button key={m.id} onClick={() => setSelectedMesero(m)} style={{
                  padding: '10px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.9rem',
                  border: selectedMesero?.id === m.id ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.1)',
                  background: selectedMesero?.id === m.id ? 'rgba(255,107,107,0.05)' : 'rgba(0,0,0,0.02)',
                  color: selectedMesero?.id === m.id ? 'var(--primary-color)' : 'var(--text-dark)',
                }}>{m.name}</button>
              ))}
            </div>
            {selectedMesero && (
              <input type="password" maxLength={4} autoFocus placeholder="PIN (4 dígitos)" value={meseroPin}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setMeseroPin(val);
                  if (val.length === 4) {
                    if (val === String(selectedMesero.pin || '').trim()) { setShowMeseroModal(false); executeAction(actionType, selectedMesero.name); }
                    else { showToast('PIN Incorrecto', 'error'); setMeseroPin(''); }
                  }
                }}
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.15)', outline: 'none' }}
              />
            )}
            <button onClick={() => setShowMeseroModal(false)}
              style={{ padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.05)', color: 'var(--text-light)', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Cart Item row ────────────────────────────────────────────────────────────
function CartItem({ item, updateQuantity, removeFromCart }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(0,0,0,0.03)', padding: '8px 10px', borderRadius: '10px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</p>
        <span style={{ color: 'var(--primary-color)', fontSize: '0.88rem' }}>${(item.price * item.quantity).toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={() => updateQuantity(item.id, -1, item.persona)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Minus size={14} />
        </button>
        <span style={{ fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
        <button onClick={() => updateQuantity(item.id, 1, item.persona)} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={14} />
        </button>
        <button onClick={() => removeFromCart(item.id, item.persona)} style={{ background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginLeft: '2px', display: 'flex' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
