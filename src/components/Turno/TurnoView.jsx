import React, { useState, useEffect } from 'react';
import { PlayCircle, StopCircle, Calculator, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast, useConfirm } from '../../context/ToastContext';

export default function TurnoView() {
  const { config } = useApp();
  const showToast = useToast();
  const showConfirm = useConfirm();
  
  // Current shift State
  const [shift, setShift] = useState(null);
  
  // Open Shift Form
  const [cajero, setCajero] = useState('');
  const [fondoInicial, setFondoInicial] = useState(config?.defaultFondo || '');
  
  // Close Shift Form
  const [efectivoReal, setEfectivoReal] = useState('');
  
  // History State
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const current = localStorage.getItem('currentShift');
    if (current) setShift(JSON.parse(current));
    
    const hist = localStorage.getItem('shiftHistory');
    if (hist) setHistory(JSON.parse(hist));
  }, []);

  const handleOpenShift = (e) => {
    e.preventDefault();
    if (!cajero.trim() || !fondoInicial) return;
    
    const newShift = {
      id: Date.now().toString(),
      openedAt: new Date().toISOString(),
      cajero,
      fondoInicial: parseFloat(fondoInicial),
      orders: 0,
      ventasEfectivo: 0,
      ventasTarjeta: 0,
      ventasTransferencia: 0,
    };
    
    localStorage.setItem('currentShift', JSON.stringify(newShift));
    setShift(newShift);

    // Auto-register fondo inicial in Caja Chica
    const fondoMovement = {
      id: `fondo-${newShift.id}`,
      shiftId: newShift.id,
      shiftLabel: cajero,
      type: 'ingreso',
      amount: parseFloat(fondoInicial),
      description: `Fondo Inicial — Turno de ${cajero}`,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    };
    const existingCaja = JSON.parse(localStorage.getItem('cajaChica') || '[]');
    localStorage.setItem('cajaChica', JSON.stringify([fondoMovement, ...existingCaja]));

    showToast(`Turno abierto por ${cajero} — Fondo $${parseFloat(fondoInicial).toFixed(2)} registrado en Caja Chica`, 'success');
    setCajero('');
    setFondoInicial('');
  };

  const handleCloseShift = async () => {
    if (efectivoReal === '') {
      showToast('Ingresa el efectivo físico en caja para poder cerrar el turno.', 'error');
      return;
    }

    const confirmed = await showConfirm('¿Estás seguro de cerrar el turno actual? Se guardará un resumen del corte de caja.');
    if (!confirmed) return;
    
    const realCash = parseFloat(efectivoReal) || 0;
    const totalVentas = shift.ventasEfectivo + shift.ventasTarjeta + shift.ventasTransferencia;
    const efectivoEsperado = shift.fondoInicial + shift.ventasEfectivo;
    const diferencia = realCash - efectivoEsperado;

    const closedShift = {
      ...shift,
      closedAt: new Date().toISOString(),
      totalVentas,
      efectivoEsperado,
      efectivoReal: realCash,
      diferencia,
    };
    
    const newHistory = [closedShift, ...history];
    localStorage.setItem('shiftHistory', JSON.stringify(newHistory));
    setHistory(newHistory);
    
    // Clear current shift
    localStorage.removeItem('currentShift');
    setShift(null);
    setEfectivoReal('');
    showToast('Turno cerrado. Resumen guardado en el historial.', 'success');
  };

  const formatMoney = (amount) => `$${parseFloat(amount || 0).toFixed(2)}`;
  const formatDate = (isoString) => new Date(isoString).toLocaleString();

  if (!shift) {
    return (
      <div style={{ padding: '10px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <PlayCircle size={32} /> Apertura de Turno
        </h1>
        
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ color: 'var(--text-light)', textAlign: 'center', margin: 0 }}>
            No hay un turno activo. Abre uno para comenzar a cobrar.
          </p>
          <form onSubmit={handleOpenShift} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '8px', display: 'block' }}>Nombre del Cajero</label>
              <input
                required
                value={cajero}
                onChange={e => setCajero(e.target.value)}
                placeholder="Ej: Juan Pérez"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)', marginBottom: '8px', display: 'block' }}>Fondo de Caja (Efectivo inicial)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={fondoInicial}
                onChange={e => setFondoInicial(e.target.value)}
                placeholder="0.00"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', fontSize: '1rem', outline: 'none' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '15px', marginTop: '10px', fontSize: '1.05rem', background: 'var(--success-color)' }}>
              <PlayCircle size={20} /> Abrir Turno
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0 }}>
          <Calculator size={32} /> Corte de Caja
        </h1>
        <button className="btn-primary" onClick={handleCloseShift} style={{ background: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StopCircle size={18} /> Cerrar Turno
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px' }}>
        {/* Current Shift Summary */}
        <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'start', background: 'white' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '15px' }}>Turno Actual</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Cajero:</span>
              <strong>{shift.cajero}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Abierto a las:</span>
              <strong style={{ fontSize: '0.9rem' }}>{new Date(shift.openedAt).toLocaleTimeString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Órdenes cobradas:</span>
              <strong>{shift.orders}</strong>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '5px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-light)' }}>Fondo Inicial:</span>
              <span>{formatMoney(shift.fondoInicial)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)' }}>
              <span>Ventas Efectivo:</span>
              <span>+ {formatMoney(shift.ventasEfectivo)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3498db' }}>
              <span>Ventas Tarjeta:</span>
              <span>+ {formatMoney(shift.ventasTarjeta)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9b59b6' }}>
              <span>Transferencias:</span>
              <span>+ {formatMoney(shift.ventasTransferencia)}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.03)', padding: '15px', borderRadius: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
              <span>Total Ventas:</span>
              <span>{formatMoney(shift.ventasEfectivo + shift.ventasTarjeta + shift.ventasTransferencia)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              <span>Efectivo Físico Esperado:</span>
              <span>{formatMoney(shift.fondoInicial + shift.ventasEfectivo)}</span>
            </div>
            
            <div style={{ marginTop: '15px', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '15px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '8px', display: 'block' }}>Efectivo Real Físico en Caja</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={efectivoReal}
                onChange={e => setEfectivoReal(e.target.value)}
                placeholder="Cuenta tu efectivo y pon la cantidad..."
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--primary-color)', background: 'white', fontFamily: 'inherit', fontSize: '1.1rem', outline: 'none', color: 'var(--primary-color)', fontWeight: 'bold' }}
              />
              {efectivoReal !== '' && (
                <div style={{ marginTop: '10px', fontWeight: 'bold', fontSize: '1.05rem', color: (parseFloat(efectivoReal) - (shift.fondoInicial + shift.ventasEfectivo)) >= 0 ? 'var(--success-color)' : 'var(--primary-color)' }}>
                  Diferencia: {formatMoney(parseFloat(efectivoReal) - (shift.fondoInicial + shift.ventasEfectivo))} 
                  {parseFloat(efectivoReal) - (shift.fondoInicial + shift.ventasEfectivo) >= 0 ? ' (Sobrante/Exacto)' : ' (Faltante)'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Shift History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.2rem' }}>
            <FileText size={20} /> Historial de Turnos
          </h2>
          
          {history.length === 0 ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
              No hay turnos cerrados todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {history.map(h => (
                <div key={h.id} className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{formatDate(h.closedAt)}</h3>
                    <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Cajero: <strong>{h.cajero}</strong> | Órdenes: {h.orders}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--success-color)' }}>
                      Ventas: {formatMoney(h.totalVentas)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '4px' }}>
                      Dif: {formatMoney(h.diferencia || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
