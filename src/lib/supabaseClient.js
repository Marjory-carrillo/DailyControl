import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvwbtpskavvykxyzohoh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2J0cHNrYXZ2eWt4eXpvaG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODU0MTMsImV4cCI6MjA5ODc2MTQxM30.archl5g_bWNCDNAbSPlzBL6tWZeuLe7_SJIDqH4gSKA';

export const supabase = createClient(supabaseUrl, supabaseKey);
