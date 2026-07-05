import React from 'react';
import { useFinanzas } from '../../context/FinanzasContext';
import { ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { useConfirm } from '../../context/ToastContext';

export function HistorialFinanzas() {
  const { transacciones, eliminarTransaccion } = useFinanzas();
  const showConfirm = useConfirm();

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-MX', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (transacciones.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
        <p>No hay movimientos financieros registrados.</p>
        <p style={{ fontSize: '0.85rem' }}>Los ingresos y gastos que registres aparecerán aquí.</p>
      </div>
    );
  }

  const getCategoriaLabel = (cat) => {
    switch (cat) {
      case 'fijos': return 'Gastos Fijos';
      case 'variables': return 'Gastos Variables';
      case 'inversion': return 'Inversión';
      default: return cat;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Historial de Movimientos</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: '12px' }}>
          {transacciones.length} registros
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)', color: 'var(--text-light)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Concepto</th>
              <th style={{ padding: '12px 20px', fontWeight: 600 }}>Categoría</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'right' }}>Monto</th>
              <th style={{ padding: '12px 20px', fontWeight: 600, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transacciones.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <td style={{ padding: '12px 20px', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                  {formatDate(tx.fecha)}
                </td>
                <td style={{ padding: '12px 20px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tx.tipo === 'ingreso' ? (
                      <ArrowUpRight size={16} color="#10b981" />
                    ) : (
                      <ArrowDownRight size={16} color="#ef4444" />
                    )}
                    {tx.concepto}
                  </div>
                </td>
                <td style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
                  {tx.tipo === 'ingreso' ? (
                    <span style={{ color: '#10b981', background: '#d1fae5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 }}>Ingreso (50-30-20)</span>
                  ) : (
                    <span style={{ 
                      color: tx.categoria === 'fijos' ? '#3b82f6' : tx.categoria === 'variables' ? '#f59e0b' : '#10b981',
                      background: tx.categoria === 'fijos' ? '#eff6ff' : tx.categoria === 'variables' ? '#fef3c7' : '#d1fae5',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500 
                    }}>
                      {getCategoriaLabel(tx.categoria)}
                    </span>
                  )}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600, color: tx.tipo === 'ingreso' ? '#10b981' : 'var(--text-color)' }}>
                  {tx.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(tx.monto)}
                </td>
                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                  <button 
                    onClick={async () => {
                      const confirmed = await showConfirm('¿Seguro que deseas eliminar este registro? Esto recalculará los saldos disponibles.');
                      if (confirmed) {
                        eliminarTransaccion(tx.id);
                      }
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '6px', borderRadius: '4px' }}
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
