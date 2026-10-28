// Escolhe a camada de dados: Supabase quando as variáveis existem, senão o modo demonstração.
import { createLocalStore } from './local.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function createStore() {
  if (url && key) {
    const { createSupabaseStore } = await import('./supabase.js');
    return createSupabaseStore(url, key);
  }
  return createLocalStore();
}
