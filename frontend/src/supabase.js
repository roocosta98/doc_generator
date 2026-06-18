import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://whlpznzvuwcnmnlqvtdy.supabase.co';
const supabaseAnonKey = 'sb_publishable_vqvsuTzoqiDGerM1hKYmiw_2cpbHCZS';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
