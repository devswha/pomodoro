import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Creating Supabase client directly...');
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

console.log('Testing real-time connection...');
const channel = supabase.channel('test-mcp-realtime');

const timeout = setTimeout(() => {
  console.log('❌ Real-time connection timeout after 8 seconds');
  channel.unsubscribe();
  process.exit(1);
}, 8000);

channel.subscribe((status, err) => {
  clearTimeout(timeout);
  console.log('✅ Real-time status:', status);
  if (err) {
    console.log('Error:', err);
    process.exit(1);
  }
  if (status === 'SUBSCRIBED') {
    console.log('🎉 Real-time connection successful!');
    channel.unsubscribe();
    process.exit(0);
  }
});
