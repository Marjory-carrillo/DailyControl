import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { printKitchenNote } from '../utils/printKitchenNote';

const OrdersContext = createContext();

export function OrdersProvider({ children, restaurantId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    fetchOrders();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
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
    if (payload.eventType === 'INSERT') {
      setOrders(prev => [payload.new, ...prev]);
      
      // Auto-print kitchen note if enabled on this device and status is 'en_preparacion'
      if (payload.new.status === 'en_preparacion') {
        const autoPrint = localStorage.getItem('autoPrintKitchen') === 'true';
        if (autoPrint) {
          try {
            printKitchenNote(payload.new);
          } catch (e) {
            console.error('Error auto-printing kitchen note:', e);
          }
        }
      }
    } else if (payload.eventType === 'UPDATE') {
      setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
    } else if (payload.eventType === 'DELETE') {
      setOrders(prev => prev.filter(o => o.id !== payload.old.id));
    }
  };

  const addOrder = async (orderData) => {
    // Generate a secure UUID in client if DB doesn't automatically default it
    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
    const { id: _localId, ...rest } = orderData;
    const orderWithTenant = {
      ...rest,
      id: generatedId,
      restaurant_id: restaurantId,
      // Ensure JSONB columns are proper objects (not strings)
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
      deleteOrder
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  return useContext(OrdersContext);
}
