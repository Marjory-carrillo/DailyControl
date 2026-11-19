import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useOrders } from './OrdersContext';

const TurnoContext = createContext();

const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// Totales del turno, calculados siempre desde los pedidos (una sola fuente de verdad).
export function calcShiftStats(orders, shift) {
  const stats = { count: 0, efectivo: 0, transferencia: 0, envios: 0, enviosEfectivo: 0 };
  if (!shift) return stats;
  const openTime = new Date(shift.openedAt).getTime();
  orders.forEach(o => {
    if (!(Number(o.timestamp) >= openTime && (o.status === 'paid' || o.status === 'entregado'))) return;
    const deliveryFee = parseFloat(o.delivery?.deliveryFee || 0);
    const foodTotal = parseFloat(o.total || 0) - deliveryFee;
    const method = (o.paymentMethod || 'Efectivo').toLowerCase();
    stats.count += 1;
    stats.envios += deliveryFee;
    if (method === 'efectivo') {
      stats.efectivo += foodTotal;
      stats.enviosEfectivo += deliveryFee;
    } else {
      stats.transferencia += foodTotal; // Transferencia (y cualquier otro método no-efectivo)
    }
  });
  return stats;
}

// Turno abierto, historial de turnos y caja chica del restaurante, compartidos entre dispositivos.
export function TurnoProvider({ children, restaurantId }) {
  const { orders } = useOrders();
  const [shift, setShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [movements, setMovements] = useState([]);

  const fetchAll = useCallback(async () => {
    if (!restaurantId) return;
    // shortcut: trae toda la caja y los últimos 50 turnos; paginar cuando haya años de datos.
    const [sh, caja] = await Promise.all([
      supabase.from('shifts').select('*').eq('restaurant_id', restaurantId).order('openedAt', { ascending: false }).limit(50),
      supabase.from('caja_movements').select('*').eq('restaurant_id', restaurantId).order('timestamp', { ascending: false }),
    ]);
    if (sh.error) console.error('Error cargando turnos:', sh.error);
    if (caja.error) console.error('Error cargando caja:', caja.error);
    const shifts = sh.data || [];
    setShift(shifts.find(s => !s.closedAt) || null);
    setHistory(shifts.filter(s => s.closedAt));
    setMovements(caja.data || []);
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchAll();
    const filter = `restaurant_id=eq.${restaurantId}`;
    const channel = supabase
      .channel(`turno:${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts', filter }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'caja_movements', filter }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId, fetchAll]);

  const shiftStats = useMemo(() => calcShiftStats(orders, shift), [orders, shift]);

  const addMovement = async ({ type, amount, description, shiftId, shiftLabel }) => {
    const now = new Date();
    const { error } = await supabase.from('caja_movements').insert([{
      restaurant_id: restaurantId,
      shiftId: shiftId ?? shift?.id ?? null,
      shiftLabel: shiftLabel ?? (shift ? shift.cajero : 'Sin turno'),
      type, amount, description,
      date: todayIso(now),
      time: now.toLocaleTimeString(),
      timestamp: now.getTime(),
    }]);
    if (error) throw error;
    await fetchAll();
  };

  const deleteMovement = async (id) => {
    const { error } = await supabase.from('caja_movements').delete().eq('id', id);
    if (error) throw error;
    await fetchAll();
  };

  const openShift = async (cajero, fondoInicial) => {
    const { data, error } = await supabase.from('shifts')
      .insert([{ restaurant_id: restaurantId, cajero, fondoInicial }])
      .select().single();
    if (error) {
      // 23505 = ya hay un turno abierto (índice único): otro dispositivo se adelantó.
      if (error.code === '23505') { await fetchAll(); throw new Error('Ya hay un turno abierto en otro dispositivo.'); }
      throw error;
    }
    await addMovement({
      type: 'ingreso', amount: fondoInicial,
      description: `Fondo Inicial — Turno de ${cajero}`,
      shiftId: data.id, shiftLabel: cajero,
    });
  };

  const closeShift = async (efectivoReal) => {
    const s = shiftStats;
    const efectivoEsperado = shift.fondoInicial + s.efectivo + s.enviosEfectivo;
    const { error } = await supabase.from('shifts').update({
      closedAt: new Date().toISOString(),
      orders: s.count,
      ventasEfectivo: s.efectivo,
      ventasTransferencia: s.transferencia,
      ventasEnvios: s.envios,
      enviosEfectivo: s.enviosEfectivo,
      totalVentas: s.efectivo + s.transferencia,
      totalEnvios: s.envios,
      efectivoEsperado,
      efectivoReal,
      diferencia: efectivoReal - efectivoEsperado,
    }).eq('id', shift.id);
    if (error) throw error;
    await fetchAll();
  };

  return (
    <TurnoContext.Provider value={{
      shift, history, movements, shiftStats,
      openShift, closeShift, addMovement, deleteMovement,
    }}>
      {children}
    </TurnoContext.Provider>
  );
}

export function useTurno() {
  return useContext(TurnoContext);
}
