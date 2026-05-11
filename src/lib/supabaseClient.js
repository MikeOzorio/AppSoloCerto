import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SOLO_CERTO_AUTH_KEY = 'solocerto-auth-v1';

export function clearSupabaseAuthStorage() {
  try {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;

      const isSupabaseKey =
        key === SOLO_CERTO_AUTH_KEY ||
        key.startsWith('sb-') ||
        key.includes('supabase.auth.token');

      // Mantém preferências locais do app, como tema claro/escuro.
      const isSoloCertoPreference = key.startsWith('@SoloCerto:');

      if (isSupabaseKey && !isSoloCertoPreference) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Não foi possível limpar a sessão local do Supabase:', error);
  }
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: SOLO_CERTO_AUTH_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
