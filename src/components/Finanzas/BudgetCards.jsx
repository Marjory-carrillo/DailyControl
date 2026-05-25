import React from 'react';
import { PieChart, TrendingUp, PiggyBank, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useFinanzas } from '../../context/FinanzasContext';

export function BudgetCards() {
  const { balances, balanceTotal } = useFinanzas();

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
      
      {/* Saldo Total */}
      <div className="glass-panel" style={{ background: 'linear-gradient(135deg, var(--primary-color), #ff8a3d)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontWeight: 500, opacity: 0.9 }}>Balance Total Finanzas</h3>
          <PieChart size={24} style={{ opacity: 0.8 }} />
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-1px' }}>
          {formatCurrency(balanceTotal)}
        </div>
        <p style={{ margin: '8px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
          Distribuido en 3 categorías (50/30/20)
        </p>
      </div>

      {/* Gastos Fijos (50%) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #3b82f6' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', marginBottom: '8px' }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px', borderRadius: '8px' }}>
              <ArrowDownRight size={18} />
            </div>
            <span style={{ fontWeight: 600 }}>Gastos Fijos (50%)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {formatCurrency(balances.fijos)}
          </div>
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Renta, sueldos, servicios, etc.
        </p>
      </div>

      {/* Gastos Variables (30%) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #f59e0b' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', marginBottom: '8px' }}>
            <div style={{ background: '#fef3c7', color: '#f59e0b', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={18} />
            </div>
            <span style={{ fontWeight: 600 }}>Gastos Variables (30%)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {formatCurrency(balances.variables)}
          </div>
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Insumos, imprevistos, reparaciones.
        </p>
      </div>

      {/* Inversión (20%) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', marginBottom: '8px' }}>
            <div style={{ background: '#d1fae5', color: '#10b981', padding: '6px', borderRadius: '8px' }}>
              <PiggyBank size={18} />
            </div>
            <span style={{ fontWeight: 600 }}>Inversión / Ahorro (20%)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-color)' }}>
            {formatCurrency(balances.inversion)}
          </div>
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          Mejoras, equipo nuevo, fondo de reserva.
        </p>
      </div>

    </div>
  );
}
