import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hwbvhnybbkswnchhcroq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3YnZobnliYmtzd25jaGhjcm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NDkzODYsImV4cCI6MjEwMjAyNTM4Nn0._dxOnrZPXLHtacfFjg74LErBR7h-bVRD3aZeDAZ8XzM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { //bağlantı aracı
  auth: {
    storage: AsyncStorage,//local de giriş bilgileri saklama veritabanına git gel yapmamak için
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});