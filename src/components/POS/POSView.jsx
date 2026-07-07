import React, { useState, useEffect } from 'react';
import MenuGrid from './MenuGrid';
import CartSidebar from './CartSidebar';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOrders } from '../../context/OrdersContext';
import { printTicket } from '../../utils/printTicket';
import { printKitchenNote } from '../../utils/printKitchenNote';
import { ShoppingCart, Search, X, ClipboardList } from 'lucide-react';
import OpenAccountsModal from './OpenAccountsModal';

export default function POSView({ employeeInfo }) {
  const { categories, products, config } = useApp();
  const { addToast } = useToast();
  const { addOrder, orders, registerOrderInShift } = useOrders();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState('menu');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showOpenAccounts, setShowOpenAccounts] = useState(false);
  const [loadedAccount, setLoadedAccount] = useState(null);
  const [activePersona, setActivePersona] = useState(''); // current persona for adding items

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add to cart — now supports persona
  const handleAddToCart = (item) => {
    setCart(prev => {
      // Find existing item with same id AND same persona
      const persona = activePersona || undefined;
      const existing = prev.find(i => i.id === item.id && (i.persona || '') === (persona || ''));
      if (existing) {
        return prev.map(i =>
          (i.id === item.id && (i.persona || '') === (persona || ''))
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, persona: persona || undefined }];
    });
  };

  const updateQuantity = (id, delta, persona) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && (item.persona || '') === (persona || '')) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id, persona) => {
    setCart(prev => prev.filter(item => !(item.id === id && (item.persona || '') === (persona || ''))));
  };

  const [openAccountId, setOpenAccountId] = useState(null);

  const handleCheckout = async (note, discountAmount, total, paymentMethod, deliveryInfo, meseroName, tableNumber, actionType = 'checkout') => {
    if (cart.length === 0) return;
    
    try {
      const currentShiftStr = localStorage.getItem('currentShift');
      // Solo checkout y save requieren turno abierto — prepare (cocina) puede hacerlo cualquier empleado
      if (!currentShiftStr && actionType !== 'prepare') {
        addToast('No hay turno abierto. Solo puedes mandar a preparar.', 'error');
        return;
      }
      
      const method = paymentMethod || 'Efectivo';
      const now = new Date();
      const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // Numeración consecutiva diaria — empieza en #10 cada día
      let orderId = openAccountId;
      let orderNumber = openAccountId;
      if (!orderId) {
        const todayOrders = orders.filter(o => {
          let oDate = o.date;
          if (o.timestamp) {
            const d = new Date(Number(o.timestamp));
            oDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          }
          return oDate === isoDate;
        });
        const maxNum = todayOrders.reduce((max, o) => {
          const num = parseInt(o.order_number || o.id, 10);
          return !isNaN(num) && num < 10000 ? Math.max(max, num) : max;
        }, 9);
        orderId = undefined; // Let Supabase generate UUID
        orderNumber = String(maxNum + 1);
      }
      
      const orderData = {
        id: orderId,
        order_number: orderNumber || orderId,
        items: [...cart],
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: discountAmount || 0,
        total: total,
        note: note || '',
        paymentMethod: method,
        delivery: deliveryInfo || null,
        mesero: meseroName || null,
        table: tableNumber || null,
        time: now.toLocaleTimeString(),
        date: isoDate,
        timestamp: Date.now(),
        status: actionType === 'save' ? 'open' : (deliveryInfo ? 'en_preparacion' : 'paid'),
      };

      // Update Order History
      if (actionType === 'save' || !openAccountId) {
        // Enviar a Supabase (sólo si es checkout o estamos guardando un openAccountId por primera vez en Supabase, 
        // pero vamos a mantener openAccounts en local para mesas, y checkout en Supabase)
      }

      // 'prepare': imprime comanda para cocina + ticket del cliente si es domicilio
      if (actionType === 'prepare') {
        if (tableNumber && !deliveryInfo) {
          // Es una mesa/barra. No va a la cola de cocina, va directo a cuentas abiertas
          const openAccs = JSON.parse(localStorage.getItem('openAccounts') || '[]');
          const existingIdx = openAccs.findIndex(a => a.id === orderId);
          if (existingIdx >= 0) openAccs[existingIdx] = orderData;
          else openAccs.push(orderData);
          localStorage.setItem('openAccounts', JSON.stringify(openAccs));
          
          try {
            printKitchenNote(orderData);
          } catch (printErr) {
            console.error('Failed to print kitchen note:', printErr);
          }
          addToast(`Mesa enviada a Cuentas Abiertas y ticket de pedido impreso ✓`, 'success');
        } else {
          // Flujo normal para llevar o domicilio: va a la cola de cocina
          const prepOrder = { ...orderData, status: 'en_preparacion' };
          const savedOrder = await addOrder(prepOrder);
          const finalOrder = (savedOrder && savedOrder[0]) ? savedOrder[0] : prepOrder;
          
          try {
            printKitchenNote(finalOrder);
          } catch (printErr) {
            console.error('Failed to print kitchen note:', printErr);
          }
          
          if (deliveryInfo) {
            try {
              // Imprimir ticket del cliente con el número de cuenta si paga por transferencia
              printTicket({ ...finalOrder, id: finalOrder.order_number || finalOrder.id }, config);
            } catch (printErr) {
              console.error('Failed to print ticket:', printErr);
            }
          }
          addToast(`Comanda enviada a cocina 🍳`, 'success');
        }
      } else if (actionType === 'checkout') {
        const savedOrder = await addOrder(orderData); // Guardar en Supabase
        const finalOrder = (savedOrder && savedOrder[0]) ? savedOrder[0] : orderData;

        // Actualizar turno local solo si existe (el dispositivo del admin)
        if (currentShiftStr) {
          registerOrderInShift(finalOrder);
        }

        if (openAccountId) {
          const openAccs = JSON.parse(localStorage.getItem('openAccounts') || '[]');
          localStorage.setItem('openAccounts', JSON.stringify(openAccs.filter(a => a.id !== openAccountId)));
        }

        try {
          printTicket({ ...finalOrder, id: finalOrder.order_number || finalOrder.id }, config);
        } catch (printErr) {
          console.error('Failed to print ticket:', printErr);
        }
        addToast(`Orden cobrada ✓`, 'success');
      } else if (actionType === 'save') {
        const openAccs = JSON.parse(localStorage.getItem('openAccounts') || '[]');
        const existingIdx = openAccs.findIndex(a => a.id === orderId);
        if (existingIdx >= 0) openAccs[existingIdx] = orderData;
        else openAccs.push(orderData);
        localStorage.setItem('openAccounts', JSON.stringify(openAccs));
        
        addToast(`Mesa ${tableNumber || orderId} guardada ✓`, 'success');
      }

      setCart([]);
      setOpenAccountId(null);
      setLoadedAccount(null);
      setActivePersona('');
      setMobileView('menu');
    } catch (err) {
      console.error(err);
      addToast(`Error al procesar: ${err.message}`, 'error');
    }
  };

  const loadOpenAccount = (acc) => {
    setCart(acc.items);
    setOpenAccountId(acc.id);
    setLoadedAccount(acc);
    setShowOpenAccounts(false);
    setMobileView('cart');
    addToast(`Cuenta #${acc.id} cargada.`, 'success');
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Mobile layout ──
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0px' }}>
        {/* Toggle bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
          <button onClick={() => setMobileView('menu')} style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem',
            background: mobileView === 'menu' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
            color: mobileView === 'menu' ? '#fff' : 'var(--text-dark)',
          }}>📋 Menú</button>
          <button onClick={() => setMobileView('cart')} style={{
            flex: 1, padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700', fontSize: '0.95rem', position: 'relative',
            background: mobileView === 'cart' ? 'var(--primary-color)' : 'rgba(0,0,0,0.05)',
            color: mobileView === 'cart' ? '#fff' : 'var(--text-dark)',
          }}>
            <ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Carrito
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 10, background: '#ff6b6b', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{cartCount}</span>
            )}
          </button>
        </div>

        {/* Menu view */}
        {mobileView === 'menu' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', marginBottom: '10px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                  {searchTerm && <X size={16} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', cursor: 'pointer' }} />}
                </div>
                <button onClick={() => setShowOpenAccounts(true)}
                  style={{ background: 'var(--primary-color)', color: 'white', padding: '0 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.82rem', flexShrink: 0 }}>
                  <ClipboardList size={16} /> Ctas
                </button>
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                    background: activeCategory === cat.id ? 'var(--primary-color)' : 'transparent',
                    color: activeCategory === cat.id ? 'white' : 'var(--text-dark)',
                    border: activeCategory === cat.id ? 'none' : '1px solid var(--text-light)',
                    padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{cat.name}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <MenuGrid selectedCategory={activeCategory} items={products} onAddToCart={handleAddToCart} searchTerm={searchTerm} />
            </div>
          </div>
        )}

        {/* Cart view */}
        {mobileView === 'cart' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
             <CartSidebar
              cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart}
              onCheckout={handleCheckout} loadedAccount={loadedAccount}
              onCloseAccount={() => { setCart([]); setOpenAccountId(null); setLoadedAccount(null); setMobileView('menu'); }}
              fullHeight
              activePersona={activePersona}
              onSetActivePersona={setActivePersona}
              employeeInfo={employeeInfo}
            />
          </div>
        )}

        {showOpenAccounts && (
          <OpenAccountsModal onClose={() => setShowOpenAccounts(false)} onLoadAccount={loadOpenAccount} onDeleteAccount={(id) => { if (openAccountId === id) { setCart([]); setOpenAccountId(null); setLoadedAccount(null); } }} />
        )}
      </div>
    );
  }

  // ── Desktop layout ──
  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="glass-panel" style={{ display: 'flex', gap: '15px', padding: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '250px', flex: '1 1 auto', display: 'flex', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input type="text" placeholder="Buscar producto por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }} />
              {searchTerm && <X size={18} onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', cursor: 'pointer' }} />}
            </div>
            <button onClick={() => setShowOpenAccounts(true)}
              style={{ background: 'var(--primary-color)', color: 'white', padding: '0 20px', borderRadius: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <ClipboardList size={18} /> Abiertas
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '2 1 auto' }}>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                background: activeCategory === cat.id ? 'var(--primary-color)' : 'transparent',
                color: activeCategory === cat.id ? 'white' : 'var(--text-dark)',
                border: activeCategory === cat.id ? 'none' : '1px solid var(--text-light)',
                padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
              }}>{cat.name}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MenuGrid selectedCategory={activeCategory} items={products} onAddToCart={handleAddToCart} searchTerm={searchTerm} />
        </div>
      </div>
      <CartSidebar
        cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart}
        onCheckout={handleCheckout} loadedAccount={loadedAccount}
        onCloseAccount={() => { setCart([]); setOpenAccountId(null); setLoadedAccount(null); }}
        activePersona={activePersona}
        onSetActivePersona={setActivePersona}
        employeeInfo={employeeInfo}
      />

      {showOpenAccounts && (
        <OpenAccountsModal onClose={() => setShowOpenAccounts(false)} onLoadAccount={loadOpenAccount} onDeleteAccount={(id) => { if (openAccountId === id) { setCart([]); setOpenAccountId(null); setLoadedAccount(null); } }} />
      )}
    </div>
  );
}
