import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

const DEFAULT_CONFIG = {
  businessName: 'Mi Negocio',
  slogan: 'Sistema de Punto de Venta',
  phone: '',
  logo: null,
  ownerPin: '1234',
  deliveryEnabled: false,
  defaultFondo: '',          // Fondo de caja predeterminado
  defaultDeliveryFee: 0,     // Tarifa de envío predeterminada
  transferAccount: '',       // Número de cuenta / CLABE para transferencias
  protectedTabs: ['dashboard', 'menu', 'settings', 'caja', 'turno', 'costeo'], // Módulos protegidos
};
const DEFAULT_CATEGORIES = [{ id: 'productos', name: 'Productos' }];

// Configuración y menú del negocio, guardados en restaurant_settings (una fila por restaurante).
export function AppProvider({ children, restaurantId }) {
  const [config, setConfigState] = useState(DEFAULT_CONFIG);
  const [categories, setCategoriesState] = useState(DEFAULT_CATEGORIES);
  const [products, setProductsState] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const applyRow = (row) => {
    if (!row) return;
    setConfigState({ ...DEFAULT_CONFIG, ...row.config });
    setCategoriesState(row.categories?.length ? row.categories : DEFAULT_CATEGORIES);
    setProductsState(row.products || []);
  };

  useEffect(() => {
    if (!restaurantId) return;
    supabase.from('restaurant_settings').select('*').eq('restaurant_id', restaurantId).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Error cargando configuración:', error);
        applyRow(data);
        setLoaded(true);
      });

    // Cambios hechos en otro dispositivo (ej. el dueño edita el menú) llegan solos.
    const channel = supabase
      .channel(`settings:${restaurantId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'restaurant_settings', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => applyRow(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurantId]);

  // Solo el dueño puede guardar (RLS); para empleados esto falla y se registra en consola.
  const save = async (patch) => {
    const { error } = await supabase.from('restaurant_settings')
      .upsert({ restaurant_id: restaurantId, ...patch, updated_at: new Date().toISOString() });
    if (error) console.error('Error guardando configuración:', error);
  };

  const setConfig = (next) => { setConfigState(next); save({ config: next }); };
  const setCategories = (next) => { setCategoriesState(next); save({ categories: next }); };
  const setProducts = (next) => { setProductsState(next); save({ products: next }); };

  // --- Category actions ---
  const addCategory = (cat) => setCategories([...categories, { id: Date.now().toString(), name: cat.name }]);
  const updateCategory = (id, data) => setCategories(categories.map(c => c.id === id ? { ...c, ...data } : c));
  const deleteCategory = (id) => {
    const nextCategories = categories.filter(c => c.id !== id);
    const nextProducts = products.filter(p => p.category !== id);
    setCategoriesState(nextCategories);
    setProductsState(nextProducts);
    save({ categories: nextCategories, products: nextProducts });
  };

  // --- Product actions ---
  const addProduct = (product) => setProducts([...products, { ...product, id: Date.now() }]);
  const updateProduct = (id, data) => setProducts(products.map(p => p.id === id ? { ...p, ...data } : p));
  const deleteProduct = (id) => setProducts(products.filter(p => p.id !== id));

  // Sin esto, pantallas como Configuración arrancarían con valores por defecto y los guardarían encima.
  if (!loaded) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-light)' }}>Cargando…</div>;
  }

  return (
    <AppContext.Provider value={{
      config, setConfig,
      categories, addCategory, updateCategory, deleteCategory,
      products, addProduct, updateProduct, deleteProduct,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
