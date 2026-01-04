import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Database types
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  is_flagged: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentWithAuthor extends Comment {
  author_name: string;
  author_avatar: string | null;
  flag_count: number;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  scroll_percentage: number;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  confirmed: boolean;
  confirmation_token: string;
  unsubscribe_token: string;
  subscribed_at: string;
  confirmed_at: string | null;
}
