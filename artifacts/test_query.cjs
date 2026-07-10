const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvwbtpskavvykxyzohoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2J0cHNrYXZ2eWt4eXpvaG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODU0MTMsImV4cCI6MjA5ODc2MTQxM30.archl5g_bWNCDNAbSPlzBL6tWZeuLe7_SJIDqH4gSKA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log('Subscribing to realtime channel...');
  
  let eventReceived = false;
  
  const channel = supabase
    .channel('public:orders_test')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      console.log('Realtime event received! Payload:', payload);
      eventReceived = true;
    })
    .subscribe((status) => {
      console.log('Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed! Inserting test order...');
        // Insert a dummy order
        supabase.from('orders').insert([
          {
            id: 'test-realtime-' + Date.now(),
            restaurant_id: '2d2178e6-873d-49da-9e2f-2416fb47c433',
            items: [],
            subtotal: 0,
            total: 0,
            paymentMethod: 'Efectivo',
            status: 'paid',
            time: '12:00:00',
            date: '2026-07-09',
            timestamp: Date.now()
          }
        ]).then(({ data, error }) => {
          if (error) {
            console.error('Insert error:', error);
          } else {
            console.log('Insert successful!');
          }
        });
      }
    });

  // Wait 10 seconds to see if we get the event
  setTimeout(() => {
    console.log('Done waiting. Event received:', eventReceived);
    // Cleanup the dummy order
    supabase.from('orders').delete().eq('id', 'test-realtime-*').then(() => {
      process.exit(eventReceived ? 0 : 1);
    });
  }, 10000);
}

testRealtime();
