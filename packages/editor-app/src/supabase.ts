import { createClient } from "@supabase/supabase-js";
import { assertDef } from "./utils";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
assertDef(supabaseUrl);
assertDef(supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey); 