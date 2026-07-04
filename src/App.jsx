import React, { useState } from 'react';
import { ShoppingCart, ChefHat, BarChart3, Receipt, UtensilsCrossed, Settings, Lock, Wallet, ClipboardList, Calculator, TrendingUp, Navigation } from 'lucide-react';
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

// Tabs that are ALWAYS protected (settings can never be unlocked)
const ALWAYS_PROTECTED = ['settings'];

function PinModal({ onSuccess, onCancel }) {
  const { config } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPin = config.ownerPin || '1234';
    if (pin === correctPin) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-panel" style={{ padding: '40px', width: '320px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '2.5rem' }}>🔐</div>
        <div>
          <h2 style={{ margin: 0 }}>Área Restringida</h2>
          <p style={{ color: 'var(--text-light)', marginTop: '8px', fontSize: '0.95rem' }}>
            Este módulo es solo para el dueño o administrador. Ingresa tu PIN para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="password"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            placeholder="• • • •"
            style={{
              textAlign: 'center', letterSpacing: '10px', fontSize: '1.4rem',
              padding: '14px', borderRadius: '10px',
              border: error ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', outline: 'none',
            }}
          />
          {error && <p style={{ color: 'var(--primary-color)', margin: 0, fontSize: '0.9rem' }}>PIN incorrecto. Intenta de nuevo.</p>}
          <button className="btn-primary" type="submit" style={{ padding: '13px' }}>
            <Lock size={16} style={{ marginRight: 8 }} />Entrar
          </button>
          <button type="button" onClick={onCancel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontFamily: 'inherit', padding: '6px' }}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

function AppShell({ onLogout }) {
  const [activeTab, setActiveTab] = useState('pos');
  const [pendingTab, setPendingTab] = useState(null);
  const { config } = useApp();

  const isPinEnabled = config.pinProtectionEnabled !== false;

  const handleTabClick = (tab) => {
    const protectedTabs = config.protectedTabs || ALWAYS_PROTECTED;
    if (isPinEnabled && protectedTabs.includes(tab)) {
      setPendingTab(tab);
    } else {
      setActiveTab(tab);
    }
  };

  const handlePinSuccess = () => {
    setActiveTab(pendingTab);
    setPendingTab(null);
  };

  // ── Nav: Mesero removed, Costeo added ──
  const navTabs = [
    { id: 'pos',       label: 'POS',     icon: <ShoppingCart size={20} /> },
    { id: 'turno',     label: 'Turno',   icon: <ClipboardList size={20} /> },
    { id: 'caja',      label: 'Caja',    icon: <Wallet size={20} /> },
    { id: 'finanzas',  label: 'Finanzas', icon: <TrendingUp size={20} />, alwaysLocked: true },
    { id: 'costeo',    label: 'Costeo',  icon: <Calculator size={20} /> },
    { id: 'dashboard', label: 'Ventas',  icon: <BarChart3 size={20} /> },
    { id: 'menu',      label: 'Menú',    icon: <UtensilsCrossed size={20} /> },
    { id: 'settings',  label: 'Config',  icon: <Settings size={20} />, alwaysLocked: true },
  ];

  return (
    <div className="app-shell" style={{ backgroundColor: config.appBackgroundColor || 'var(--bg-color)' }}>
      {/* PIN Modal */}
      {pendingTab && (
        <PinModal onSuccess={handlePinSuccess} onCancel={() => setPendingTab(null)} />
      )}

      {/* ── Desktop sidebar (left) ── */}
      <nav className="glass-panel app-sidebar">
        <div style={{ color: 'var(--primary-color)', marginBottom: '12px' }}>
          {config.logo
            ? <img src={config.logo} alt="logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
            : <ChefHat size={32} />
          }
        </div>

        {navTabs.slice(0, 3).map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            locked={isPinEnabled && (t.alwaysLocked || config.protectedTabs?.includes(t.id))}
            onClick={() => handleTabClick(t.id)}
          />
        ))}

        <div style={{ width: '40px', height: '1px', background: 'rgba(0,0,0,0.1)', margin: '6px 0' }} />

        {navTabs.slice(3).map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            locked={isPinEnabled && (t.alwaysLocked || config.protectedTabs?.includes(t.id))}
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
        {activeTab === 'pos'       && <POSView />}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'caja'      && <CajaChicaView />}
        {activeTab === 'finanzas'  && <FinanzasView />}
        {activeTab === 'menu'      && <MenuEditorView />}
        {activeTab === 'settings'  && <SettingsView />}
        {activeTab === 'turno'     && <TurnoView />}
        {activeTab === 'costeo'    && <CosteoView />}
      </main>

      {/* ── Mobile/Tablet Bottom Nav ── */}
      <nav className="app-bottom-nav">
        {navTabs.map(t => (
          <NavItem key={t.id} {...t}
            active={activeTab === t.id}
            locked={t.alwaysLocked || config.protectedTabs?.includes(t.id)}
            onClick={() => handleTabClick(t.id)}
            compact
          />
        ))}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, locked, compact = false }) {
  return (
    <button
      onClick={onClick}
      title={locked ? `${label} (solo dueño)` : label}
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
      {locked && !active && (
        <span style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.5rem' }}>🔒</span>
      )}
    </button>
  );
}

import { OrdersProvider } from './context/OrdersContext';
import LoginView from './components/Auth/LoginView';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('appSession');
    if (saved) return JSON.parse(saved);
    // Legacy fallback
    const oldRole = localStorage.getItem('appRole');
    if (oldRole === 'restaurant') return { role: 'admin' };
    if (oldRole === 'delivery') return { role: 'repartidor' };
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
              <AppShell onLogout={handleLogout} />
            ) : (
              <DeliveryView onLogout={handleLogout} />
            )}
          </ToastProvider>
        </FinanzasProvider>
      </OrdersProvider>
    </AppProvider>
  );
}
