import { supabase } from '@/lib/supabase';

export async function signOut() {
  return supabase.auth.signOut();
}
