import React, { useState } from 'react';
import { ShoppingCart, ChefHat, BarChart3, Receipt, UtensilsCrossed, Settings, Lock, Wallet, ClipboardList, Calculator, TrendingUp, Navigation } from 'lucide-react';
import { useOrders } from './context/OrdersContext';
import KitchenView from './components/Kitchen/KitchenView';
import './index.css';

import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import POSView from './components/POS/POSView';
import DashboardView from './components/Dashboard/DashboardView';
import MenuEditorView from './components/Menu/MenuEditorView';
import SettingsView from './components/Settings/SettingsView';
import CajaChicaView from './components/CajaChica/CajaChicaView';
import TurnoView from './components/Turno/TurnoView';
import CosteoView from './components/Costeo/CosteoView';
import FinanzasView from './components/Finanzas/FinanzasView';
import { FinanzasProvider } from './context/FinanzasContext';
import DeliveryView from './components/Delivery/DeliveryView';
import MeseroView from './components/Staff/MeseroView';



function AppShell({ onLogout, session }) {
  const [activeTab, setActiveTab] = useState('pos');
  const { config } = useApp();
  const { orders } = useOrders();

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Contador de órdenes en preparación para el badge de Cocina
  const kitchenCount = orders.filter(o => o.status === 'en_preparacion').length;

  const navTabs = [
    { id: 'pos',       label: 'POS',     icon: <ShoppingCart size={20} /> },
    { id: 'cocina',    label: 'Cocina',  icon: <UtensilsCrossed size={20} />, badge: kitchenCount },
    { id: 'turno',     label: 'Turno',   icon: <ClipboardList size={20} /> },
    { id: 'caja',      label: 'Caja',    icon: <Wallet size={20} /> },
    { id: 'finanzas',  label: 'Finanzas', icon: <TrendingUp size={20} /> },
    { id: 'costeo',    label: 'Costeo',  icon: <Calculator size={20} /> },
    { id: 'dashboard', label: 'Ventas',  icon: <BarChart3 size={20} /> },
    { id: 'menu',      label: 'Menú',    icon: <UtensilsCrossed size={20} /> },
    { id: 'settings',  label: 'Config',  icon: <Settings size={20} /> },
  ];

  return (
    <div className="app-shell" style={{ backgroundColor: config.appBackgroundColor || 'var(--bg-color)' }}>

      {/* ── Desktop sidebar (left) ── */}
      <nav className="glass-panel app-sidebar">
        <div style={{ color: 'var(--primary-color)', marginBottom: '12px' }}>
          {config.logo
            ? <img src={config.logo} alt="logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
            : <ChefHat size={32} />
          }
        </div>

        {navTabs.slice(0, 4).map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            onClick={() => handleTabClick(t.id)}
          />
        ))}

        <div style={{ width: '40px', height: '1px', background: 'rgba(0,0,0,0.1)', margin: '6px 0' }} />

        {navTabs.slice(4).map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            onClick={() => handleTabClick(t.id)}
          />
        ))}

        <div style={{ flex: 1 }} />
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <Lock size={20} /> Salir
        </button>
      </nav>

      {/* ── Main Content ── */}
      <main className="glass-panel app-main">
        {activeTab === 'pos'       && <POSView employeeInfo={session?.employeeInfo} />}
        {activeTab === 'cocina'    && <KitchenView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'caja'      && <CajaChicaView />}
        {activeTab === 'finanzas'  && <FinanzasView />}
        {activeTab === 'menu'      && <MenuEditorView />}
        {activeTab === 'settings'  && <SettingsView restaurantId={session?.restaurant_id} restaurantName={session?.user?.email?.split('@')[0]} onLogout={onLogout} />}
        {activeTab === 'turno'     && <TurnoView />}
        {activeTab === 'costeo'    && <CosteoView />}
      </main>

      {/* ── Mobile/Tablet Bottom Nav ── */}
      <nav className="app-bottom-nav">
        {navTabs.map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            onClick={() => handleTabClick(t.id)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, compact = false, badge = 0 }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        background: active ? 'var(--primary-color)' : 'transparent',
        color: active ? 'white' : 'var(--text-light)',
        border: 'none',
        borderRadius: compact ? '10px' : '14px',
        padding: compact ? '8px 6px' : '11px',
        cursor: 'pointer',
        transition: 'all 0.22s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        width: compact ? 'auto' : '56px',
        flex: compact ? 1 : undefined,
        position: 'relative',
      }}
    >
      {icon}
      <span className="nav-item-label">{label}</span>
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: compact ? 4 : 6, right: compact ? 6 : 6,
          background: '#FF9800', color: 'white',
          borderRadius: '50%', width: '17px', height: '17px',
          fontSize: '0.65rem', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 'bold', lineHeight: 1,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

import { OrdersProvider } from './context/OrdersContext';
import LoginView from './components/Auth/LoginView';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(() => {
    // Limpiar claves del sistema anterior
    localStorage.removeItem('appRole');
    const saved = localStorage.getItem('appSession');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const handleLoginSuccess = (sessionData) => {
    localStorage.setItem('appSession', JSON.stringify(sessionData));
    setSession(sessionData);
  };

  const handleLogout = async () => {
    if (session?.role === 'admin') {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('appSession');
    setSession(null);
  };

  if (!session) {
    return (
      <ToastProvider>
        <LoginView onLoginSuccess={handleLoginSuccess} />
      </ToastProvider>
    );
  }

  return (
    <AppProvider>
      <OrdersProvider restaurantId={session.restaurant_id}>
        <FinanzasProvider>
          <ToastProvider>
            {session.role === 'admin' ? (
              <AppShell onLogout={handleLogout} session={session} />
            ) : session.role === 'mesero' ? (
              <MeseroView onLogout={handleLogout} employeeInfo={session.employeeInfo} />
            ) : (
              <DeliveryView onLogout={handleLogout} />
            )}
          </ToastProvider>
        </FinanzasProvider>
      </OrdersProvider>
    </AppProvider>
  );
}
