import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Admin client with service role (for server-side operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client client with anon key (for client-side operations)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_value: string;
  key_name: string;
  is_active: boolean;
  is_used: boolean;
  used_at?: string;
  expires_at?: string;
  created_at: string;
  last_used_at?: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  session_name: string;
  model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  termux_command?: string;
  termux_output?: string;
  token_count?: number;
  created_at: string;
}

export interface TermuxCommandLog {
  id: string;
  user_id: string;
  session_id?: string;
  command: string;
  output?: string;
  exit_code?: number;
  execution_time_ms?: number;
  is_allowed: boolean;
  created_at: string;
}
