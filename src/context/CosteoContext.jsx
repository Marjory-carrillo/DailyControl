import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const CosteoContext = createContext();

export function CosteoProvider({ children, restaurantId }) {
  const [ingredientes, setIngredientes] = useState([]);
  const [preparaciones, setPreparaciones] = useState([]);
  const [recetas, setRecetas] = useState([]);     // { product_id, lines: [{source, source_id, qty, unit}] }
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const [ing, prep, rec, lot] = await Promise.all([
        supabase.from('rc_ingredientes').select('*').eq('restaurant_id', restaurantId).order('nombre'),
        supabase.from('rc_preparaciones').select('*').eq('restaurant_id', restaurantId).order('nombre'),
        supabase.from('rc_recetas').select('*').eq('restaurant_id', restaurantId),
        supabase.from('rc_lotes').select('*').eq('restaurant_id', restaurantId).order('fecha', { ascending: false }),
      ]);
      if (ing.data)  setIngredientes(ing.data);
      if (prep.data) setPreparaciones(prep.data);
      if (rec.data)  setRecetas(rec.data);
      if (lot.data)  setLotes(lot.data);
    } catch (err) {
      console.error('CosteoContext fetchAll error:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Ingredientes CRUD ──────────────────────────────────────────────────────
  const addIngrediente = async (data) => {
    const row = { ...data, restaurant_id: restaurantId };
    const { data: res, error } = await supabase.from('rc_ingredientes').insert([row]).select().single();
    if (error) throw error;
    setIngredientes(prev => [...prev, res].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return res;
  };

  const updateIngrediente = async (id, data) => {
    const { data: res, error } = await supabase.from('rc_ingredientes').update(data).eq('id', id).select().single();
    if (error) throw error;
    setIngredientes(prev => prev.map(i => i.id === id ? res : i));
    return res;
  };

  const deleteIngrediente = async (id) => {
    const { error } = await supabase.from('rc_ingredientes').delete().eq('id', id);
    if (error) throw error;
    setIngredientes(prev => prev.filter(i => i.id !== id));
  };

  // ── Preparaciones CRUD ─────────────────────────────────────────────────────
  const addPreparacion = async (data) => {
    // data = { nombre, descripcion, ingredientes: [{source, source_id, cantidad, unidad}],
    //          rendimiento_gramos, porciones, gramos_por_porcion }
    const row = { ...data, restaurant_id: restaurantId };
    const { data: res, error } = await supabase.from('rc_preparaciones').insert([row]).select().single();
    if (error) throw error;
    setPreparaciones(prev => [...prev, res].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return res;
  };

  const updatePreparacion = async (id, data) => {
    const { data: res, error } = await supabase.from('rc_preparaciones').update(data).eq('id', id).select().single();
    if (error) throw error;
    setPreparaciones(prev => prev.map(p => p.id === id ? res : p));
    return res;
  };

  const deletePreparacion = async (id) => {
    const { error } = await supabase.from('rc_preparaciones').delete().eq('id', id);
    if (error) throw error;
    setPreparaciones(prev => prev.filter(p => p.id !== id));
  };

  // ── Recetas CRUD ───────────────────────────────────────────────────────────
  const upsertReceta = async (productId, lines) => {
    // lines = [{ source: 'ingrediente'|'preparacion', source_id, qty }]
    const existing = recetas.find(r => r.product_id === productId);
    if (existing) {
      const { data: res, error } = await supabase
        .from('rc_recetas').update({ lines }).eq('id', existing.id).select().single();
      if (error) throw error;
      setRecetas(prev => prev.map(r => r.product_id === productId ? res : r));
      return res;
    } else {
      const row = { product_id: productId, lines, restaurant_id: restaurantId };
      const { data: res, error } = await supabase.from('rc_recetas').insert([row]).select().single();
      if (error) throw error;
      setRecetas(prev => [...prev, res]);
      return res;
    }
  };

  const getRecetaByProduct = (productId) => recetas.find(r => r.product_id === productId) || null;

  // ── Lotes CRUD ─────────────────────────────────────────────────────────────
  const addLote = async (data) => {
    const row = { ...data, restaurant_id: restaurantId, fecha: new Date().toISOString() };
    const { data: res, error } = await supabase.from('rc_lotes').insert([row]).select().single();
    if (error) throw error;
    setLotes(prev => [res, ...prev]);
    // After adding a lote, refresh preparaciones so cost averages update
    const { data: prep } = await supabase.from('rc_preparaciones').select('*').eq('restaurant_id', restaurantId).order('nombre');
    if (prep) setPreparaciones(prep);
    return res;
  };

  const deleteLote = async (id) => {
    const { error } = await supabase.from('rc_lotes').delete().eq('id', id);
    if (error) throw error;
    setLotes(prev => prev.filter(l => l.id !== id));
  };

  // ── Cost calculators ───────────────────────────────────────────────────────
  // Returns cost per porción for an ingrediente (price / porciones)
  const getCostoIngrediente = (id) => {
    const ing = ingredientes.find(i => i.id === id);
    if (!ing || !ing.porciones || ing.porciones <= 0) return 0;
    return ing.precio / ing.porciones;
  };

  // Returns cost per porción for a preparacion (sum of ingredients / porciones)
  const getCostoPreparacion = (id) => {
    const prep = preparaciones.find(p => p.id === id);
    if (!prep || !prep.porciones || prep.porciones <= 0) return 0;
    const totalCosto = (prep.ingredientes || []).reduce((sum, line) => {
      if (line.source === 'ingrediente') {
        return sum + getCostoIngrediente(line.source_id) * line.cantidad;
      } else if (line.source === 'preparacion') {
        return sum + getCostoPreparacion(line.source_id) * line.cantidad;
      }
      return sum;
    }, 0);
    return totalCosto / prep.porciones;
  };

  // Returns total cost for a product's recipe
  const getCostoReceta = (productId) => {
    const receta = getRecetaByProduct(productId);
    if (!receta || !receta.lines) return 0;
    return receta.lines.reduce((sum, line) => {
      if (line.source === 'ingrediente') {
        return sum + getCostoIngrediente(line.source_id) * line.qty;
      } else if (line.source === 'preparacion') {
        return sum + getCostoPreparacion(line.source_id) * line.qty;
      }
      return sum;
    }, 0);
  };

  return (
    <CosteoContext.Provider value={{
      loading,
      ingredientes, addIngrediente, updateIngrediente, deleteIngrediente,
      preparaciones, addPreparacion, updatePreparacion, deletePreparacion,
      recetas, upsertReceta, getRecetaByProduct,
      lotes, addLote, deleteLote,
      getCostoIngrediente, getCostoPreparacion, getCostoReceta,
      refetch: fetchAll,
    }}>
      {children}
    </CosteoContext.Provider>
  );
}

export function useCosteo() {
  return useContext(CosteoContext);
}
