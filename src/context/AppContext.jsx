import React, { createContext, useContext, useState, useEffect } from 'react';
import { menuItems as defaultMenuItems, categories as defaultCategories } from '../data/mockData';

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
  protectedTabs: ['dashboard', 'menu', 'settings', 'caja', 'turno', 'costeo'], // Módulos protegidos
};

const DATA_VERSION = '2'; // Increment to reset stored data

export function AppProvider({ children }) {
  // One-time migration: clear old mock data if version changed
  useEffect(() => {
    const storedVersion = localStorage.getItem('dataVersion');
    if (storedVersion !== DATA_VERSION) {
      localStorage.removeItem('menuCategories');
      localStorage.removeItem('menuProducts');
      localStorage.setItem('dataVersion', DATA_VERSION);
    }
  }, []);

  // Business config
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('businessConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  // Menu categories
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('menuCategories');
    return saved ? JSON.parse(saved) : defaultCategories;
  });

  // Menu products
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('menuProducts');
    return saved ? JSON.parse(saved) : defaultMenuItems;
  });

  // Meseros (Waiters)
  const [meseros, setMeseros] = useState(() => {
    const saved = localStorage.getItem('businessMeseros');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist config
  useEffect(() => {
    localStorage.setItem('businessConfig', JSON.stringify(config));
  }, [config]);

  // Persist categories
  useEffect(() => {
    localStorage.setItem('menuCategories', JSON.stringify(categories));
  }, [categories]);

  // Persist products
  useEffect(() => {
    localStorage.setItem('menuProducts', JSON.stringify(products));
  }, [products]);

  // Persist meseros
  useEffect(() => {
    localStorage.setItem('businessMeseros', JSON.stringify(meseros));
  }, [meseros]);

  // --- Category actions ---
  const addCategory = (cat) => {
    const newCat = { id: Date.now().toString(), name: cat.name };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id, data) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCategory = (id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setProducts(prev => prev.filter(p => p.category !== id));
  };

  // --- Product actions ---
  const addProduct = (product) => {
    const newProduct = { ...product, id: Date.now() };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id, data) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // --- Mesero actions ---
  const addMesero = (mesero) => {
    const newMesero = { ...mesero, id: Date.now().toString() };
    setMeseros(prev => [...prev, newMesero]);
  };

  const deleteMesero = (id) => {
    setMeseros(prev => prev.filter(m => m.id !== id));
  };

  return (
    <AppContext.Provider value={{
      config, setConfig,
      categories, addCategory, updateCategory, deleteCategory,
      products, addProduct, updateProduct, deleteProduct,
      meseros, setMeseros, addMesero, deleteMesero,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
