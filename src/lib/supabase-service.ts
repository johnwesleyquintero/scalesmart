// src/lib/supabase-service.ts

import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// You can add functions here to interact with Supabase, e.g.:
// export async function getConfiguration() {
//   const { data, error } = await supabase
//     .from('configurations')
//     .select('*')
//     .single();

//   if (error) {
//     console.error('Error fetching configuration:', error);
//     return null;
//   }
//   return data;
// }
