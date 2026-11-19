import React, { useState, useEffect } from 'react';
import MenuGrid from './MenuGrid';
import CartSidebar from './CartSidebar';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOrders } from '../../context/OrdersContext';
import { useTurno } from '../../context/TurnoContext';
import { printTicket } from '../../utils/printTicket';
import { printKitchenNote } from '../../utils/printKitchenNote';
import { planPosAction, pendingKitchenItems, markItemsSent } from '../../utils/orderFlow';
import { ShoppingCart, Search, X } from 'lucide-react';
import TableMapModal from './TableMapModal';
import ActiveDeliveriesModal from './ActiveDeliveriesModal';

export default function POSView({ employeeInfo, onOpenTab }) {
  const { categories, products, config } = useApp();
  const { addToast } = useToast();
  const { addOrder, updateOrder } = useOrders();
  const { shift } = useTurno();

  // Guard: check if a shift is open before allowing any cart action
  const requireShift = () => {
    if (!shift) {
      addToast('⚠️ No hay turno abierto. Abriendo Turno...', 'error');
      if (onOpenTab) onOpenTab('turno');
      return false;
    }
    return true;
  };
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || null);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileView, setMobileView] = useState('menu');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showTableMap, setShowTableMap] = useState(false);
  const [showActiveDeliveries, setShowActiveDeliveries] = useState(false);
  const [loadedAccount, setLoadedAccount] = useState(null);
  const [activePersona, setActivePersona] = useState('Orden 1'); // current persona for adding items

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add to cart — blocks if no shift is open
  const handleAddToCart = (item) => {
    if (!requireShift()) return;
    setCart(prev => {
      const persona = activePersona || 'Orden 1';
      // Buscar si ya existe el mismo artículo sin una nota individual para incrementar cantidad
      const existing = prev.find(i => i.id === item.id && (i.persona || 'Orden 1') === persona && !i.itemNote);
      if (existing) {
        return prev.map(i =>
          (i.cartItemId === existing.cartItemId)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, cartItemId: Date.now() + Math.random().toString(), quantity: 1, persona: persona, itemNote: '' }];
    });
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateItemNote = (cartItemId, note) => {
    setCart(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, itemNote: note } : item));
  };

  const [openAccountId, setOpenAccountId] = useState(null);

  const handleCheckout = async (note, discountAmount, total, paymentMethod, deliveryInfo, meseroName, tableNumber, actionType = 'checkout') => {
    if (cart.length === 0) return;
    if (!shift) {
      addToast('No hay turno abierto.', 'error');
      return;
    }

    const pending = pendingKitchenItems(cart);
    if (actionType === 'prepare' && pending.length === 0) {
      addToast('No hay productos nuevos para mandar a cocina.', 'error');
      return;
    }
    const plan = planPosAction(actionType, {
      isDelivery: !!deliveryInfo,
      table: tableNumber || null,
      currentStatus: loadedAccount?.status,
      hasPending: pending.length > 0,
    });
    if (plan.error) {
      addToast(plan.error, 'error');
      return;
    }

    try {
      const now = new Date();
      const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // order_number lo asigna la base al insertar (diario, desde #10) y no cambia al actualizar.
      const orderData = {
        items: plan.printKitchen ? markItemsSent(cart) : cart,
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        discount: discountAmount || 0,
        total: total,
        note: note || '',
        paymentMethod: paymentMethod || 'Efectivo',
        delivery: deliveryInfo || null,
        mesero: meseroName || null,
        table: tableNumber || null,
        time: now.toLocaleTimeString(),
        date: isoDate,
        timestamp: Date.now(),
        status: plan.status,
        ...(plan.markPaid ? { paidAt: loadedAccount?.paidAt ?? now.toISOString() } : {}),
      };

      const res = openAccountId ? await updateOrder(openAccountId, orderData) : await addOrder(orderData);
      const finalOrder = res?.[0] ?? orderData;

      // La cola de impresión garantiza comanda y luego ticket, sin pisarse.
      if (plan.printKitchen) printKitchenNote({ ...finalOrder, items: pending });
      if (plan.printTicket) printTicket(finalOrder, config);

      addToast(
        actionType === 'save' ? 'Cuenta guardada ✓'
          : actionType === 'prepare' ? 'Comanda enviada a cocina 🍳'
          : 'Orden cobrada ✓',
        'success'
      );

      setCart([]);
      setOpenAccountId(null);
      setLoadedAccount(null);
      setActivePersona('Orden 1');
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
    setShowTableMap(false);
    setMobileView('cart');
    addToast(`Cuenta ${acc.table || '#' + acc.order_number} cargada.`, 'success');
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
                <button onClick={() => setShowTableMap(true)}
                  style={{ background: 'var(--primary-color)', color: 'white', padding: '0 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.82rem', flexShrink: 0 }}>
                  🗺️ Mesas
                </button>
                <button onClick={() => setShowActiveDeliveries(true)}
                  style={{ background: '#6c5ce7', color: 'white', padding: '0 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', fontSize: '0.82rem', flexShrink: 0 }}>
                  🛵 Envíos
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
              cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} updateItemNote={updateItemNote}
              onCheckout={handleCheckout} loadedAccount={loadedAccount}
              onCloseAccount={() => { setCart([]); setOpenAccountId(null); setLoadedAccount(null); setMobileView('menu'); }}
              fullHeight
              activePersona={activePersona}
              onSetActivePersona={setActivePersona}
              employeeInfo={employeeInfo}
            />
          </div>
        )}

        {showTableMap && (
          <TableMapModal 
            onClose={() => setShowTableMap(false)} 
            onLoadAccount={(acc) => {
              loadOpenAccount(acc);
              setShowTableMap(false);
            }}
            onStartNewOrder={(tableName) => {
              if (!requireShift()) return;
              setOpenAccountId(null);
              setLoadedAccount(tableName ? { table: tableName, items: [] } : null);
              if (!tableName) setCart([]);
              setShowTableMap(false);
            }}
          />
        )}

        {showActiveDeliveries && (
          <ActiveDeliveriesModal 
            onClose={() => setShowActiveDeliveries(false)} 
            onLoadAccount={(acc) => {
              loadOpenAccount(acc);
              setShowActiveDeliveries(false);
            }}
          />
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
            <button onClick={() => setShowTableMap(true)}
              style={{ background: 'var(--primary-color)', color: 'white', padding: '0 20px', borderRadius: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              🗺️ Mesas
            </button>
            <button onClick={() => setShowActiveDeliveries(true)}
              style={{ background: '#6c5ce7', color: 'white', padding: '0 20px', borderRadius: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              🛵 Envíos / Llevar
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
        cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} updateItemNote={updateItemNote}
        onCheckout={handleCheckout} loadedAccount={loadedAccount}
        onCloseAccount={() => { setCart([]); setOpenAccountId(null); setLoadedAccount(null); }}
        activePersona={activePersona}
        onSetActivePersona={setActivePersona}
        employeeInfo={employeeInfo}
      />

      {showTableMap && (
        <TableMapModal 
          onClose={() => setShowTableMap(false)} 
          onLoadAccount={(acc) => {
            loadOpenAccount(acc);
            setShowTableMap(false);
          }}
          onStartNewOrder={(tableName) => {
            if (!requireShift()) return;
            setOpenAccountId(null);
            setLoadedAccount(tableName ? { table: tableName, items: [] } : null);
            if (!tableName) setCart([]);
            setShowTableMap(false);
          }}
        />
      )}

      {showActiveDeliveries && (
        <ActiveDeliveriesModal 
          onClose={() => setShowActiveDeliveries(false)} 
          onLoadAccount={(acc) => {
            loadOpenAccount(acc);
            setShowActiveDeliveries(false);
          }}
        />
      )}
    </div>
  );
}
