import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("TU-PROYECTO")) {
  throw new Error(
    "[Fernández Tours] Faltan credenciales de Supabase.\n" +
      "Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
