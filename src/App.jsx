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

function AppShell() {
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

function RoleSelector({ onSelectRole }) {
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    if (pin === '0000') {
      onSelectRole('delivery');
    } else {
      setError(true);
      setPin('');
    }
  };

  if (pinMode) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '320px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '2.5rem' }}>🛵</div>
          <h2>Acceso Repartidor</h2>
          <form onSubmit={handleDeliverySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              maxLength={4}
              autoFocus
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false); }}
              placeholder="PIN de Repartidor"
              style={{ textAlign: 'center', letterSpacing: '10px', fontSize: '1.4rem', padding: '14px', borderRadius: '10px', border: error ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.15)', outline: 'none' }}
            />
            {error && <p style={{ color: 'var(--primary-color)', margin: 0, fontSize: '0.9rem' }}>PIN incorrecto.</p>}
            <button className="btn-primary" type="submit" style={{ padding: '13px' }}>Entrar</button>
            <button type="button" onClick={() => setPinMode(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '6px' }}>Volver</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--bg-color)', gap: '20px' }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌮</div>
      <h1 style={{ color: 'var(--text-dark)' }}>¿Quién eres?</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => onSelectRole('restaurant')}
          className="glass-panel" 
          style={{ width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <ChefHat size={48} color="var(--primary-color)" />
          <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>Restaurante</h2>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Punto de venta y admin</p>
        </button>
        
        <button 
          onClick={() => setPinMode(true)}
          className="glass-panel" 
          style={{ width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', cursor: 'pointer', border: 'none', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Navigation size={48} color="#FF9800" />
          <h2 style={{ margin: 0, color: 'var(--text-dark)' }}>Repartidor</h2>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>App de entregas</p>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('appRole'));

  const handleSelectRole = (selectedRole) => {
    localStorage.setItem('appRole', selectedRole);
    setRole(selectedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('appRole');
    setRole(null);
  };

  if (!role) {
    return <RoleSelector onSelectRole={handleSelectRole} />;
  }

  return (
    <AppProvider>
      <OrdersProvider>
        <FinanzasProvider>
          <ToastProvider>
            {role === 'delivery' ? <DeliveryView onLogout={handleLogout} /> : <AppShell />}
          </ToastProvider>
        </FinanzasProvider>
      </OrdersProvider>
    </AppProvider>
  );
}
