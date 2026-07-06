import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Trash2, History, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

export default function CajaChicaView() {
  const { addToast } = useToast();
  const { config } = useApp();

  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({ type: 'ingreso', amount: '', description: '' });
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletePin, setDeletePin] = useState('');

  const currentShift = (() => {
    try { return JSON.parse(localStorage.getItem('currentShift') || 'null'); } catch { return null; }
  })();
  const shiftId = currentShift?.id || null;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cajaChica') || '[]');
    setMovements(stored);
  }, []);

  const saveMovements = (updated) => {
    setMovements(updated);
    localStorage.setItem('cajaChica', JSON.stringify(updated));
  };

  const handleSave = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      addToast('Ingresa un monto válido.', 'error');
      return;
    }
    if (!form.description.trim()) {
      addToast('Ingresa un concepto.', 'error');
      return;
    }
    if (!currentShift) {
      addToast('Sin turno activo — el movimiento se registrará sin turno.', 'warning');
    }
    const now = new Date();
    const isoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newMovement = {
      id: Date.now().toString(),
      shiftId,
      shiftLabel: currentShift ? (currentShift.cashierName || `Turno ${shiftId}`) : 'Sin turno',
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      date: isoDate,
      time: now.toLocaleTimeString(),
      timestamp: Date.now(),
    };
    saveMovements([newMovement, ...movements]);
    setForm({ type: 'ingreso', amount: '', description: '' });
    addToast('Movimiento registrado ✓', 'success');
  };

  const handleDeleteConfirm = () => {
    const ownerPin = String(config?.ownerPin || '1234').trim();
    if (deletePin !== ownerPin) {
      addToast('PIN incorrecto', 'error');
      setDeletePin('');
      return;
    }
    saveMovements(movements.filter(m => m.id !== deletingId));
    setDeletingId(null);
    setDeletePin('');
    addToast('Movimiento eliminado', 'success');
  };

  // Filter: show only current shift unless showAll is toggled
  const displayedMovements = useMemo(() => {
    if (showAll || !shiftId) return movements;
    return movements.filter(m => m.shiftId === shiftId);
  }, [movements, showAll, shiftId]);

  // Summary stats for the displayed set
  const stats = useMemo(() => {
    const ventasEfectivo = !showAll && currentShift ? (currentShift.ventasEfectivo || 0) : 0;
    const ingresos = displayedMovements
      .filter(m => m.type !== 'egreso')
      .reduce((a, m) => a + m.amount, 0);
    const egresos = displayedMovements
      .filter(m => m.type === 'egreso')
      .reduce((a, m) => a + m.amount, 0);
    return { ingresos, egresos, ventasEfectivo, saldo: ingresos + ventasEfectivo - egresos };
  }, [displayedMovements, showAll, currentShift]);

  // Group movements by date (newest day first)
  const groupedByDate = useMemo(() => {
    const groups = {};
    displayedMovements.forEach(mov => {
      const key = mov.date || 'Sin fecha';
      if (!groups[key]) groups[key] = [];
      groups[key].push(mov);
    });
    const toMs = d => {
      if (d.includes('-')) return new Date(d).getTime();
      try { 
        const [dd, mm, yyyy] = d.split('/'); 
        if (yyyy) return new Date(`${yyyy}-${mm}-${dd}`).getTime(); 
        return 0;
      }
      catch { return 0; }
    };
    return Object.entries(groups).sort(([a], [b]) => toMs(b) - toMs(a));
  }, [displayedMovements]);

  const showDateHeaders = showAll || !shiftId;

  // Styles
  const inputStyle = {
    padding: '12px 16px', borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)',
    fontFamily: 'inherit', fontSize: '1rem', color: 'var(--text-dark)',
    outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const labelStyle = {
    fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)',
    marginBottom: '6px', display: 'block',
  };

  const typeBtn = (type, label, color) => (
    <button
      onClick={() => setForm(prev => ({ ...prev, type }))}
      style={{
        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
        fontWeight: '600', fontFamily: 'inherit', fontSize: '0.9rem',
        border: form.type === type ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.1)',
        background: form.type === type ? `${color}18` : 'transparent',
        color: form.type === type ? color : 'var(--text-dark)',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', flexWrap: 'wrap' }}>

      {/* ── Left: Form + Stats ── */}
      <div style={{ width: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <Wallet /> Caja Chica
        </h1>

        {/* Shift indicator */}
        <div style={{
          padding: '10px 16px', borderRadius: '10px',
          background: currentShift ? 'rgba(29,209,161,0.1)' : 'rgba(255,165,0,0.1)',
          border: `1px solid ${currentShift ? '#1dd1a1' : '#ff9f43'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.88rem', fontWeight: '600',
          color: currentShift ? '#10ac84' : '#e67e22',
        }}>
          {currentShift ? `✓ Turno activo: ${currentShift.cashierName || shiftId}` : '⚠️ Sin turno activo'}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: '600' }}>INGRESOS CAJA</p>
            <h3 style={{ margin: '4px 0 0', color: '#1dd1a1', fontSize: '1.3rem' }}>${stats.ingresos.toFixed(2)}</h3>
          </div>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: '600' }}>EGRESOS CAJA</p>
            <h3 style={{ margin: '4px 0 0', color: 'var(--primary-color)', fontSize: '1.3rem' }}>${stats.egresos.toFixed(2)}</h3>
          </div>
        </div>

        {/* Show ventas efectivo as a separate row when a shift is active */}
        {!showAll && currentShift && stats.ventasEfectivo > 0 && (
          <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #0984e3' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: '600' }}>VENTAS EN EFECTIVO (TURNO)</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#555' }}>Incluido en el saldo total de la caja</p>
            </div>
            <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#0984e3' }}>+${stats.ventasEfectivo.toFixed(2)}</span>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '20px', background: 'var(--primary-color)', color: 'white' }}>
          <p style={{ margin: '0 0 4px 0', opacity: 0.85, fontSize: '0.9rem' }}>
            Efectivo Real en Caja {showAll ? '(Total)' : shiftId ? '(Este Turno)' : '(Total)'}
          </p>
          <h2 style={{ margin: 0, fontSize: '2.2rem' }}>${stats.saldo.toFixed(2)}</h2>
          {!showAll && currentShift && (
            <p style={{ margin: '8px 0 0', opacity: 0.75, fontSize: '0.8rem' }}>
              Fondo + Manuales + Efectivo = Saldo Real
            </p>
          )}
        </div>

        {/* Form */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ margin: 0, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '10px' }}>Nuevo Movimiento</h3>
          <div>
            <label style={labelStyle}>Tipo</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {typeBtn('ingreso', 'Ingreso', '#1dd1a1')}
              {typeBtn('egreso', 'Egreso', '#e74c3c')}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Monto ($)</label>
            <input type="number" style={inputStyle} min="0" step="0.01"
              value={form.amount}
              onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <div>
            <label style={labelStyle}>Concepto / Descripción</label>
            <input style={inputStyle}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ej: Cambio del día, pago proveedor..."
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <button className="btn-primary" style={{ padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={handleSave}>
            <Plus size={18} /> Registrar
          </button>
        </div>
      </div>

      {/* ── Right: History ── */}
      <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', minWidth: '260px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0 }}>
            Historial {showAll ? 'General' : shiftId ? 'del Turno' : 'General'}
            <span style={{ marginLeft: 8, background: 'var(--primary-color)', color: '#fff', fontSize: '0.72rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px' }}>
              {displayedMovements.length} mov.
            </span>
          </h2>
          {shiftId && (
            <button
              onClick={() => setShowAll(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px',
                background: showAll ? 'rgba(0,0,0,0.05)' : 'white',
                padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: '600', fontSize: '0.83rem', color: 'var(--text-dark)',
              }}
            >
              <History size={15} /> {showAll ? 'Ver solo turno' : 'Ver historial completo'}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayedMovements.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '40px' }}>
              No hay movimientos{shiftId && !showAll ? ' en este turno' : ''}.
            </div>
          ) : groupedByDate.map(([date, dayMovs]) => {
            const dayIn = dayMovs.filter(m => m.type !== 'egreso').reduce((a, m) => a + m.amount, 0);
            const dayOut = dayMovs.filter(m => m.type === 'egreso').reduce((a, m) => a + m.amount, 0);
            return (
              <div key={date} style={{ marginBottom: '4px' }}>
                {/* Date separator — always shown for clarity */}
                {showDateHeaders && (
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '7px 12px', background: 'rgba(0,0,0,0.04)',
                    borderRadius: '8px', marginBottom: '6px', marginTop: '6px',
                  }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.88rem' }}>
                      📅 {date}
                    </span>
                    <span style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: '#1dd1a1', fontWeight: '700' }}>+${dayIn.toFixed(2)}</span>
                      {' / '}
                      <span style={{ color: '#e74c3c', fontWeight: '700' }}>-${dayOut.toFixed(2)}</span>
                    </span>
                  </div>
                )}
                {dayMovs.map(mov => {
                  const isIn = mov.type !== 'egreso';
                  const color = isIn ? '#1dd1a1' : '#e74c3c';
                  return (
                    <div key={mov.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', background: 'rgba(255,255,255,0.4)',
                      borderRadius: '12px', borderLeft: `4px solid ${color}`,
                      marginBottom: '6px',
                    }}>
                      <div style={{ padding: '8px', borderRadius: '50%', background: `${color}18`, color, flexShrink: 0 }}>
                        {isIn ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {mov.description}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                          {mov.time}{mov.shiftLabel && ` • ${mov.shiftLabel}`}
                        </span>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color, flexShrink: 0 }}>
                        {isIn ? '+' : '-'}${mov.amount.toFixed(2)}
                      </div>
                      <button
                        onClick={() => { setDeletingId(mov.id); setDeletePin(''); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ccc', display: 'flex', padding: '4px', flexShrink: 0 }}
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Delete PIN Modal ── */}
      {deletingId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '340px', display: 'flex', flexDirection: 'column', gap: '18px', alignItems: 'center' }}>
            <Lock size={28} color="var(--primary-color)" />
            <h2 style={{ margin: 0, textAlign: 'center', fontSize: '1.2rem' }}>Confirmar eliminación</h2>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center' }}>
              Ingresa el PIN del dueño para eliminar este movimiento.
            </p>
            <input
              type="password"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={deletePin}
              onChange={e => setDeletePin(e.target.value.replace(/[^0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleDeleteConfirm()}
              style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.3rem', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.15)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => { setDeletingId(null); setDeletePin(''); }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteConfirm}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#e74c3c', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
