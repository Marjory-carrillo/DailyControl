import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { printKitchenNote } from '../utils/printKitchenNote';
import { kitchenAutoPrintItems } from '../utils/orderFlow';

const OrdersContext = createContext();

export function OrdersProvider({ children, restaurantId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Pedidos que este dispositivo acaba de escribir: ya imprimió su comanda, no la reimprime al llegar el evento.
  const localWrites = useRef(new Set());
  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`orders:${restaurantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` }, (payload) => {
        const row = payload.eventType === 'DELETE' ? payload.old : payload.new;
        if (row && row.restaurant_id === restaurantId) {
          handleRealtimeEvent(payload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleRealtimeEvent = (payload) => {
    if (payload.eventType === 'DELETE') {
      setOrders(prev => prev.filter(o => o.id !== payload.old.id));
      return;
    }
    const row = payload.new;
    if (payload.eventType === 'INSERT') setOrders(prev => [row, ...prev]);
    else setOrders(prev => prev.map(o => o.id === row.id ? row : o));

    if (localWrites.current.delete(row.id)) return;
    // Impresión automática (dispositivo de cocina): solo lo que se acaba de mandar a cocina.
    if (localStorage.getItem('autoPrintKitchen') !== 'true') return;
    const items = kitchenAutoPrintItems(payload.eventType === 'INSERT' ? null : payload.old, row);
    if (items.length > 0) printKitchenNote({ ...row, items });
  };

  const addOrder = async (orderData) => {
    // Generate a secure UUID in client if DB doesn't automatically default it
    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
    const { id: _localId, ...rest } = orderData;
    localWrites.current.add(generatedId);
    const orderWithTenant = {
      ...rest,
      id: generatedId,
      restaurant_id: restaurantId,
      items: rest.items || [],
      delivery: rest.delivery || null,
    };
    const { data, error } = await supabase
      .from('orders')
      .insert([orderWithTenant])
      .select();
      
    if (error) {
      console.error('Error adding order:', error);
      throw error;
    }
    return data;
  };

  const updateOrder = async (id, updates) => {
    localWrites.current.add(id);
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
    return data;
  };

  const bulkUpdateOrders = async (ids, updates) => {
    ids.forEach(id => localWrites.current.add(id));
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .in('id', ids)
      .select();
      
    if (error) {
      console.error('Error bulk updating orders:', error);
      throw error;
    }
    return data;
  };

  const deleteOrder = async (id) => {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  };

  return (
    <OrdersContext.Provider value={{
      orders,
      loading,
      addOrder,
      updateOrder,
      deleteOrder,
      bulkUpdateOrders
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
