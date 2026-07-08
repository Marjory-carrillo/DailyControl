import React, { useState } from 'react';
import { Trash2, Plus, Minus, Printer, Tag, Bike, MapPin, Phone, UserCircle2, X, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOrders } from '../../context/OrdersContext';

export default function CartSidebar({ cart, updateQuantity, removeFromCart, onCheckout, loadedAccount, onCloseAccount, fullHeight, activePersona, onSetActivePersona, employeeInfo }) {
  const { config } = useApp();
  const showToast = useToast();
  const { orders = [] } = useOrders() || {};

  // Extract unique colonies and streets from order history
  const colonySuggestions = React.useMemo(() => {
    const list = new Set();
    orders.forEach(o => {
      if (o.delivery?.colonia) {
        const val = o.delivery.colonia.trim();
        if (val) list.add(val);
      }
    });
    return Array.from(list);
  }, [orders]);

  const streetSuggestions = React.useMemo(() => {
    const list = new Set();
    orders.forEach(o => {
      if (o.delivery?.calle) {
        const val = o.delivery.calle.trim();
        if (val) list.add(val);
      }
    });
    return Array.from(list);
  }, [orders]);

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
  const [deliveryClientName, setDeliveryClientName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(config?.defaultDeliveryFee || 0);

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
      if (loadedAccount.delivery) {
        setIsDelivery(true);
        setDeliveryCalle(loadedAccount.delivery.calle || '');
        setDeliveryNumero(loadedAccount.delivery.numero || '');
        setDeliveryColonia(loadedAccount.delivery.colonia || '');
        setDeliveryPhone(loadedAccount.delivery.phone || '');
        setDeliveryClientName(loadedAccount.delivery.clientName || '');
        setDeliveryFee(loadedAccount.delivery.deliveryFee || 0);
      } else {
        setIsDelivery(false);
        setDeliveryFee(config?.defaultDeliveryFee || 0);
      }
    }
  }, [loadedAccount]);

  React.useEffect(() => {
    if (isDelivery && !loadedAccount) {
      setDeliveryFee(config?.defaultDeliveryFee || 0);
    }
  }, [isDelivery, config?.defaultDeliveryFee, loadedAccount]);

  React.useEffect(() => {
    if (cart.length === 0) {
      setNote(''); setDiscount(''); setPaymentMethod('Efectivo');
      setTableNumber(''); setIsDelivery(false);
      setDeliveryCalle(''); setDeliveryNumero(''); setDeliveryColonia(''); setDeliveryPhone(''); setDeliveryClientName('');
      setDeliveryFee(config?.defaultDeliveryFee || 0);
      if (onSetActivePersona) onSetActivePersona('');
    }
  }, [cart.length]);

  const handleAction = (type) => {
    executeAction(type, null);
  };

  const executeAction = (type, meseroName) => {
    const finalMesero = meseroName || employeeInfo?.name || null;
    const deliveryInfo = isDelivery ? { 
      colonia: deliveryColonia, 
      calle: deliveryCalle, 
      numero: deliveryNumero, 
      phone: deliveryPhone, 
      clientName: deliveryClientName,
      deliveryFee: parseFloat(deliveryFee) || 0
    } : null;
    onCheckout(note, discountAmount, total, paymentMethod, deliveryInfo, finalMesero, isDelivery ? null : tableNumber, type);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount + (isDelivery ? parseFloat(deliveryFee) || 0 : 0));

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
    <div className="glass-panel" style={{ width: fullHeight ? '100%' : '360px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: fullHeight ? '14px 16px' : '20px', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
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
        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(108,92,231,0.04)', display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center', flexShrink: 0 }}>
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

      {/* Middle Scrollable Section (Cart items + Config inputs) */}
      <div style={{ flex: 1, overflowY: 'auto', padding: fullHeight ? '14px 16px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Cart items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
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

        {/* Inputs (only show if cart has items) */}
        {cart.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
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

            {/* Payment method */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Método de Pago</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['Efectivo', 'Transferencia'].map(method => (
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

            {/* Delivery Option */}
            {config?.deliveryEnabled && (
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-dark)', marginBottom: isDelivery ? '10px' : '0', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={isDelivery} onChange={e => setIsDelivery(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <Bike size={18} color="var(--primary-color)" /> Domicilio
                </label>
                {isDelivery && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Nombre del cliente */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCircle2 size={15} color="var(--text-light)" />
                      <input value={deliveryClientName} onChange={e => setDeliveryClientName(e.target.value)} placeholder="Nombre del cliente..." style={{ ...inputStyle, flex: 1 }} />
                    </div>
                    {/* Colonia */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="var(--text-light)" />
                      <input 
                        list="colonia-suggestions"
                        value={deliveryColonia} 
                        onChange={e => setDeliveryColonia(e.target.value)} 
                        placeholder="Colonia..." 
                        style={{ ...inputStyle, flex: 1 }} 
                      />
                      <datalist id="colonia-suggestions">
                        {colonySuggestions.map((col, idx) => (
                          <option key={idx} value={col} />
                        ))}
                      </datalist>
                    </div>
                    {/* Calle / Número */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '23px' }}>
                      <input 
                        list="calle-suggestions"
                        value={deliveryCalle} 
                        onChange={e => setDeliveryCalle(e.target.value)} 
                        placeholder="Calle..." 
                        style={{ ...inputStyle, flex: 2 }} 
                      />
                      <datalist id="calle-suggestions">
                        {streetSuggestions.map((st, idx) => (
                          <option key={idx} value={st} />
                        ))}
                      </datalist>
                      <input value={deliveryNumero} onChange={e => setDeliveryNumero(e.target.value)} placeholder="No..." style={{ ...inputStyle, flex: 1 }} />
                    </div>
                    {/* Teléfono */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} color="var(--text-light)" />
                      <input value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value)} placeholder="Teléfono" style={{ ...inputStyle, flex: 1 }} />
                    </div>
                    {/* Costo de Envío */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-light)', minWidth: '95px' }}>🛵 Envío ($):</span>
                      <input 
                        type="number" 
                        value={deliveryFee} 
                        onChange={e => setDeliveryFee(e.target.value)} 
                        placeholder="0.00" 
                        min="0" 
                        step="0.01" 
                        style={{ ...inputStyle, flex: 1 }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Action Panel (Total and checkout buttons) */}
      {cart.length > 0 && (
        <div style={{ padding: fullHeight ? '12px 16px' : '16px 20px', borderTop: 'var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255, 255, 255, 0.45)', flexShrink: 0 }}>
          {/* Subtotal and discount if applicable */}
          {(discountAmount > 0 || (isDelivery && (parseFloat(deliveryFee) || 0) > 0)) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '6px', borderBottom: '1px dashed rgba(0,0,0,0.1)' }}>
              {discountAmount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontSize: '0.85rem' }}>
                    <span>Descuento</span><span>- ${discountAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              {isDelivery && (parseFloat(deliveryFee) || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dark)', fontSize: '0.85rem' }}>
                  <span>Envío</span><span>+ ${(parseFloat(deliveryFee) || 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Total display */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span style={{ color: 'var(--primary-color)' }}>${total.toFixed(2)}</span>
          </div>

          {/* Action buttons */}
          {!isDelivery ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'var(--warning-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '12px', fontSize: '0.9rem' }}
                  onClick={() => handleAction('save')}>Guardar</button>
                <button className="btn-primary" style={{ flex: 1, background: '#FF9800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', padding: '12px', fontSize: '0.9rem' }}
                  onClick={() => handleAction('prepare')}>
                  🍳 Preparar
                </button>
              </div>
              <button className="btn-primary" style={{ width: '100%', background: 'var(--success-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '14px', fontSize: '1rem' }}
                onClick={() => handleAction('checkout')}>
                💵 Cobrar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '12px', fontSize: '0.95rem', background: '#FF9800' }}
                disabled={!deliveryCalle.trim() || !deliveryColonia.trim()} onClick={() => handleAction('prepare')}>
                🛵 Preparar (Domicilio)
              </button>
              <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '14px', fontSize: '1rem', background: 'var(--success-color)' }}
                disabled={!deliveryCalle.trim() || !deliveryColonia.trim()} onClick={() => handleAction('checkout')}>
                💵 Cobrar (Domicilio)
              </button>
            </div>
          )}
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
