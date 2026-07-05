import React, { useState, useEffect } from 'react';
import { ClipboardList, X, Clock, Trash2 } from 'lucide-react';
import { useConfirm } from '../../context/ToastContext';

export default function OpenAccountsModal({ onClose, onLoadAccount, onDeleteAccount }) {
  const [accounts, setAccounts] = useState([]);
  const showConfirm = useConfirm();

  useEffect(() => {
    setAccounts(JSON.parse(localStorage.getItem('openAccounts') || '[]'));
  }, []);

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('¿Seguro que deseas eliminar esta cuenta sin cobrarla?');
    if (!confirmed) return;
    const filtered = accounts.filter(a => a.id !== id);
    setAccounts(filtered);
    localStorage.setItem('openAccounts', JSON.stringify(filtered));
    if (onDeleteAccount) onDeleteAccount(id);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ background: 'white', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', borderRadius: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList color="var(--primary-color)" /> Cuentas Abiertas
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {accounts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '40px' }}>No hay cuentas abiertas en este momento.</p>
          ) : (
            accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    #{acc.id} 
                    {acc.table && (
                      <span style={{ fontSize: '0.8rem', background: 'rgba(52, 152, 219, 0.1)', color: '#2980b9', padding: '4px 8px', borderRadius: '10px' }}>
                        🪑 {acc.table}
                      </span>
                    )}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'flex', gap: '15px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {acc.time}</span>
                    <span>{acc.items.reduce((s,i) => s + i.quantity, 0)} artículos</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-dark)' }}>${acc.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleDelete(acc.id)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.2)', background: 'rgba(255,0,0,0.05)', color: 'red', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                  <button onClick={() => onLoadAccount(acc)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '8px' }}>
                    Abrir 
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
