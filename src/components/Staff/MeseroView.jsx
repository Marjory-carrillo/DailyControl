import React, { useState } from 'react';
import { ShoppingCart, ClipboardList, LogOut } from 'lucide-react';
import POSView from '../POS/POSView';
import TurnoView from '../Turno/TurnoView';
import { useApp } from '../../context/AppContext';

const navTabs = [
  { id: 'pos',   label: 'POS',   icon: <ShoppingCart size={20} /> },
  { id: 'turno', label: 'Turno', icon: <ClipboardList size={20} /> },
];

function NavItem({ icon, label, active, onClick, compact = false }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--primary-color)' : 'transparent',
      color: active ? 'white' : 'var(--text-light)',
      border: 'none', borderRadius: compact ? '10px' : '14px',
      padding: compact ? '8px 6px' : '11px', cursor: 'pointer',
      transition: 'all 0.22s ease', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '3px',
      width: compact ? 'auto' : '56px', flex: compact ? 1 : undefined,
    }}>
      {icon}
      <span className="nav-item-label">{label}</span>
    </button>
  );
}

export default function MeseroView({ onLogout, employeeInfo }) {
  const [activeTab, setActiveTab] = useState('pos');
  const { config } = useApp();

  return (
    <div className="app-shell" style={{ backgroundColor: config.appBackgroundColor || 'var(--bg-color)' }}>
      {/* Desktop sidebar */}
      <nav className="glass-panel app-sidebar">
        <div style={{ color: 'var(--primary-color)', marginBottom: '12px' }}>
          {config.logo
            ? <img src={config.logo} alt="logo" style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }} />
            : <span style={{ fontSize: '1.8rem' }}>🍽️</span>
          }
        </div>

        {navTabs.map(t => (
          <NavItem key={t.id} {...t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} />
        ))}

        <div style={{ flex: 1 }} />

        {/* Mesero info + logout */}
        {employeeInfo && (
          <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-light)', marginBottom: '6px', fontWeight: '600' }}>
            {employeeInfo.name}
          </div>
        )}
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          <LogOut size={20} /> Salir
        </button>
      </nav>

      {/* Main content */}
      <main className="glass-panel app-main">
        {activeTab === 'pos'   && <POSView />}
        {activeTab === 'turno' && <TurnoView />}
      </main>

      {/* Mobile bottom nav */}
      <nav className="app-bottom-nav">
        {navTabs.map(t => (
          <NavItem key={t.id} {...t} active={activeTab === t.id} onClick={() => setActiveTab(t.id)} compact />
        ))}
        <button onClick={onLogout} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer', padding: '8px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: 'bold' }}>
          <LogOut size={20} /> Salir
        </button>
      </nav>
    </div>
  );
}
