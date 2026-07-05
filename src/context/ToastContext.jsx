import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext();
const ConfirmContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null); // { message, resolve }

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      setConfirm({ message, resolve });
    });
  }, []);

  const handleConfirm = (result) => {
    if (confirm) confirm.resolve(result);
    setConfirm(null);
  };

  const toastColors = {
    success: { bg: 'linear-gradient(135deg, #1dd1a1, #10ac84)', icon: <CheckCircle2 size={22} /> },
    error:   { bg: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', icon: <AlertCircle size={22} /> },
    info:    { bg: 'linear-gradient(135deg, #74b9ff, #0984e3)', icon: <Info size={22} /> },
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      <ConfirmContext.Provider value={{ showConfirm }}>
        {children}

        {/* Toast Container — top center */}
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {toasts.map(t => {
            const style = toastColors[t.type] || toastColors.info;
            return (
              <div key={t.id} style={{
                background: style.bg,
                color: 'white',
                borderRadius: '14px',
                padding: '14px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
                animation: 'toastSlideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                minWidth: '280px',
                maxWidth: '480px',
                pointerEvents: 'auto',
                fontFamily: 'Outfit, sans-serif',
              }}>
                {style.icon}
                <span style={{ fontWeight: '600', fontSize: '0.97rem', flex: 1 }}>{t.message}</span>
              </div>
            );
          })}
        </div>

        {/* Custom Confirm Dialog */}
        {confirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              width: '360px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'center',
              fontFamily: 'Outfit, sans-serif',
              animation: 'toastSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ fontSize: '2.8rem' }}>⚠️</div>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>¿Confirmar acción?</h3>
                <p style={{ margin: 0, color: '#636e72', fontSize: '0.95rem', lineHeight: '1.5' }}>{confirm.message}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleConfirm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid rgba(0,0,0,0.12)', background: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '600', fontSize: '0.95rem', color: '#636e72' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleConfirm(true)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', color: 'white', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontWeight: '700', fontSize: '0.95rem' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes toastSlideDown {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  const addToastFn = ctx?.addToast;
  if (addToastFn) {
    addToastFn.addToast = addToastFn;
  }
  return addToastFn;
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  const showConfirmFn = ctx?.showConfirm;
  if (showConfirmFn) {
    showConfirmFn.showConfirm = showConfirmFn;
  }
  return showConfirmFn;
};


