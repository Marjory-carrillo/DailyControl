import React, { useState } from 'react';
import { useFinanzas } from '../../context/FinanzasContext';
import { X, ArrowUpRight, ArrowDownRight, Check } from 'lucide-react';

export function ModalIngreso({ onClose }) {
  const { registrarIngreso } = useFinanzas();
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) return;
    
    registrarIngreso(monto, concepto || 'Ganancias ingresadas');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#d1fae5', color: '#10b981', padding: '6px', borderRadius: '50%' }}>
              <ArrowUpRight size={20} />
            </div>
            Registrar Ganancia
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={24} />
          </button>
        </div>

        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '20px' }}>
          El monto ingresado se distribuirá automáticamente en: 50% Fijos, 30% Variables, 20% Inversión.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Monto Total ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={monto} 
              onChange={e => setMonto(e.target.value)}
              placeholder="Ej. 1500.00"
              required
              autoFocus
              className="pos-input"
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Concepto (Opcional)</label>
            <input 
              type="text" 
              value={concepto} 
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ej. Ganancias de la semana"
              className="pos-input"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          
          {monto > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div style={{ marginBottom: '4px' }}><strong>Distribución estimada:</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>Fijos (50%):</span> <span>${(monto * 0.5).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}><span>Variables (30%):</span> <span>${(monto * 0.3).toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}><span>Inversión (20%):</span> <span>${(monto * 0.2).toFixed(2)}</span></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModalGasto({ onClose }) {
  const { registrarGasto, balances } = useFinanzas();
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('fijos');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!monto || isNaN(monto) || parseFloat(monto) <= 0) return;
    
    registrarGasto(monto, concepto || 'Gasto registrado', categoria);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '6px', borderRadius: '50%' }}>
              <ArrowDownRight size={20} />
            </div>
            Registrar Gasto
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Monto ($)</label>
            <input 
              type="number" 
              step="0.01"
              value={monto} 
              onChange={e => setMonto(e.target.value)}
              placeholder="Ej. 250.00"
              required
              autoFocus
              className="pos-input"
              style={{ width: '100%', padding: '12px', fontSize: '1.2rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-light)' }}>Concepto</label>
            <input 
              type="text" 
              value={concepto} 
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ej. Pago de luz"
              required
              className="pos-input"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-light)' }}>¿De qué categoría se descuenta?</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: categoria === 'fijos' ? '2px solid #3b82f6' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: categoria === 'fijos' ? '#eff6ff' : 'white' }}>
                <input type="radio" name="categoria" value="fijos" checked={categoria === 'fijos'} onChange={() => setCategoria('fijos')} style={{ margin: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#3b82f6' }}>Gastos Fijos</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Disp: ${balances.fijos.toFixed(2)}</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: categoria === 'variables' ? '2px solid #f59e0b' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: categoria === 'variables' ? '#fef3c7' : 'white' }}>
                <input type="radio" name="categoria" value="variables" checked={categoria === 'variables'} onChange={() => setCategoria('variables')} style={{ margin: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#f59e0b' }}>Gastos Variables</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Disp: ${balances.variables.toFixed(2)}</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: categoria === 'inversion' ? '2px solid #10b981' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: categoria === 'inversion' ? '#d1fae5' : 'white' }}>
                <input type="radio" name="categoria" value="inversion" checked={categoria === 'inversion'} onChange={() => setCategoria('inversion')} style={{ margin: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#10b981' }}>Inversión</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Disp: ${balances.inversion.toFixed(2)}</div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', background: '#ef4444', borderColor: '#ef4444' }}>
              Registrar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
