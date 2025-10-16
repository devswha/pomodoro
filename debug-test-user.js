import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Raw values:');
console.log('URL:', supabaseUrl);
console.log('URL type:', typeof supabaseUrl);
console.log('URL includes supabase.co:', supabaseUrl?.includes('supabase.co'));
console.log('Key starts with eyJ:', supabaseAnonKey?.startsWith('eyJ'));

const isValidSupabaseUrl = (url) => {
  if (!url || url.includes('your_supabase') || url.includes('placeholder') || url.includes('demo.supabase.co')) {
    return false;
  }
  try {
    new URL(url);
    return url.includes('supabase.co');
  } catch {
    return false;
  }
};

console.log('URL validation result:', isValidSupabaseUrl(supabaseUrl));
console.log('Key validation result:', supabaseAnonKey && !supabaseAnonKey.includes('your_'));

const hasValidSupabaseConfig = isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey && !supabaseAnonKey.includes('your_');
console.log('hasValidSupabaseConfig:', hasValidSupabaseConfig);
