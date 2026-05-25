import React, { useState } from 'react';
import { BudgetCards } from './BudgetCards';
import { HistorialFinanzas } from './HistorialFinanzas';
import { ModalIngreso, ModalGasto } from './FinanzasModals';
import { PlusCircle, MinusCircle, Info } from 'lucide-react';

export default function FinanzasView() {
  const [showModalIngreso, setShowModalIngreso] = useState(false);
  const [showModalGasto, setShowModalGasto] = useState(false);

  return (
    <div className="fade-in" style={{ padding: '10px 0', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 5px 0', color: 'var(--text-color)' }}>Control de Finanzas</h1>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            Administra tus ganancias usando la regla 50/30/20.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-primary" 
            style={{ background: 'white', color: 'var(--text-color)', border: '1px solid #ddd' }}
            onClick={() => setShowModalGasto(true)}
          >
            <MinusCircle size={18} style={{ color: '#ef4444', marginRight: '6px' }} />
            Registrar Gasto
          </button>
          
          <button 
            className="btn-primary"
            style={{ background: '#10b981', borderColor: '#10b981' }}
            onClick={() => setShowModalIngreso(true)}
          >
            <PlusCircle size={18} style={{ marginRight: '6px' }} />
            Registrar Ganancia
          </button>
        </div>
      </div>

      <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px 16px', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '0.9rem' }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>¿Cómo funciona?</strong> Al registrar una "Ganancia" (ej. dinero que retiras de la caja para la administración), el sistema lo divide automáticamente: <strong>50%</strong> para gastos fijos, <strong>30%</strong> para gastos variables y <strong>20%</strong> para ahorro/inversión. Luego, registra tus gastos descontándolos de la categoría correspondiente para llevar un control estricto.
        </div>
      </div>

      <BudgetCards />
      
      <HistorialFinanzas />

      {showModalIngreso && <ModalIngreso onClose={() => setShowModalIngreso(false)} />}
      {showModalGasto && <ModalGasto onClose={() => setShowModalGasto(false)} />}
    </div>
  );
}
