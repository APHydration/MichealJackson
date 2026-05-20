"use client";

import { getBrowserEnv } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getBrowserEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
