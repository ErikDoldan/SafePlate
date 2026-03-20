import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tu URL de Supabase
const supabaseUrl = 'https://nzeibimsrkecwojzogce.supabase.co'; 

// Reemplaza esto con tu Publishable Key
const supabaseKey = 'sb_publishable_uYrZAK_SY3x1dzzASZPU5w_aibryuQg'; 

export const supabase = createClient(supabaseUrl, supabaseKey);