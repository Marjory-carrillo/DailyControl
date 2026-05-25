import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanzasContext = createContext();

export function FinanzasProvider({ children }) {
  // Transacciones: pueden ser "ingreso" o "gasto"
  // Un "ingreso" suma al balance total y se distribuye 50/30/20 internamente.
  // Un "gasto" resta de una de las 3 categorías específicas.
  const [transacciones, setTransacciones] = useState(() => {
    const saved = localStorage.getItem('businessFinanzas');
    return saved ? JSON.parse(saved) : [];
  });

  // Guardar en localStorage cada vez que cambien las transacciones
  useEffect(() => {
    localStorage.setItem('businessFinanzas', JSON.stringify(transacciones));
  }, [transacciones]);

  // Cálculos derivados del estado de transacciones
  const calcularBalances = () => {
    let fijos = 0;
    let variables = 0;
    let inversion = 0;

    transacciones.forEach(tx => {
      if (tx.tipo === 'ingreso') {
        fijos += tx.monto * 0.50;
        variables += tx.monto * 0.30;
        inversion += tx.monto * 0.20;
      } else if (tx.tipo === 'gasto') {
        if (tx.categoria === 'fijos') fijos -= tx.monto;
        if (tx.categoria === 'variables') variables -= tx.monto;
        if (tx.categoria === 'inversion') inversion -= tx.monto;
      }
    });

    return { fijos, variables, inversion };
  };

  const balances = calcularBalances();
  const balanceTotal = balances.fijos + balances.variables + balances.inversion;

  // Acciones
  const registrarIngreso = (monto, concepto) => {
    const nuevaTx = {
      id: Date.now().toString(),
      tipo: 'ingreso',
      monto: parseFloat(monto),
      concepto: concepto || 'Ingreso manual',
      fecha: new Date().toISOString()
    };
    setTransacciones(prev => [nuevaTx, ...prev]);
  };

  const registrarGasto = (monto, concepto, categoria) => {
    const nuevaTx = {
      id: Date.now().toString(),
      tipo: 'gasto',
      monto: parseFloat(monto),
      concepto: concepto || 'Gasto',
      categoria: categoria, // 'fijos', 'variables' o 'inversion'
      fecha: new Date().toISOString()
    };
    setTransacciones(prev => [nuevaTx, ...prev]);
  };

  const eliminarTransaccion = (id) => {
    setTransacciones(prev => prev.filter(tx => tx.id !== id));
  };

  return (
    <FinanzasContext.Provider value={{
      transacciones,
      balances,
      balanceTotal,
      registrarIngreso,
      registrarGasto,
      eliminarTransaccion
    }}>
      {children}
    </FinanzasContext.Provider>
  );
}

export function useFinanzas() {
  return useContext(FinanzasContext);
}
