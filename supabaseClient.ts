
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://repadynzemjoyzumcjtw.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_HsUlDzcjY0BbZeUFlwVxDQ_0XLtvp_D';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Attenzione: SUPABASE_URL o SUPABASE_ANON_KEY non configurati correttamente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
