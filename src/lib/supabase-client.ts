import { supabase as baseSupabase } from "@/integrations/supabase/client";

// Wrapper to bypass TypeScript issues with empty database types
export const supabase = {
  auth: baseSupabase.auth,
  storage: baseSupabase.storage,
  
  from: (table: string) => {
    return (baseSupabase as any).from(table);
  },
  
  rpc: (fn: string, args?: any) => {
    return (baseSupabase as any).rpc(fn, args);
  }
};