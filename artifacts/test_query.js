const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kvwbtpskavvykxyzohoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2J0cHNrYXZ2eWt4eXpvaG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODU0MTMsImV4cCI6MjA5ODc2MTQxM30.archl5g_bWNCDNAbSPlzBL6tWZeuLe7_SJIDqH4gSKA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: employees, error: err1 } = await supabase.from('employees').select('*');
  console.log('Employees:', employees);

  const { data: orders, error: err2 } = await supabase.from('orders').select('*').limit(5);
  console.log('Last 5 orders:', orders);

  if (err1) console.error('Employees error:', err1);
  if (err2) console.error('Orders error:', err2);
}

test();
