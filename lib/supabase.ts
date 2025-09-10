import { createClient } from '@supabase/supabase-js';

// Estas son las credenciales de tu proyecto de Supabase.
// La URL es pública, y la 'anon key' es segura para ser expuesta en
// una aplicación del lado del cliente como esta.
const supabaseUrl = 'https://psqewnhpietbdjpvmyof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcWV3bmhwaWV0YmRqcHZteW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTc3OTksImV4cCI6MjA3MzAzMzc5OX0.kPh5jqgfxBltio9RgqVo_c9pvwEeCG5DrJBnPP9gsMQ';

// En una aplicación de producción real, obtendrías estos valores de variables de entorno.
// Por ejemplo: process.env.REACT_APP_SUPABASE_URL

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
