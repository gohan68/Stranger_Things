import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const profileSyncedRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, check if there's a hash with auth params (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAuthParams = hashParams.has('access_token') || hashParams.has('code');

        if (hasAuthParams) {
          console.log('OAuth callback detected, waiting for session...');
          // Give Supabase time to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Get the session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          console.log('Session status:', session ? 'Active' : 'None');
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }

          // Clean up URL hash after processing OAuth callback
          if (hasAuthParams && session) {
            console.log('Cleaning up OAuth params from URL...');
            window.history.replaceState(null, '', window.location.pathname + '#/');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'Session active' : 'No session');

      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      setLoading(false);
      return;
    }

    try {
      // Get access token from current session
      const currentSession = session;
      const accessToken = currentSession?.access_token || supabaseAnonKey;

      // Use direct REST API to fetch profile
      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const profiles = await response.json();
        const data = profiles && profiles.length > 0 ? profiles[0] : null;

        if (data) {
          // If profile exists but avatar_url is missing, try to sync from user metadata
          // Only sync once per session to avoid excessive re-renders
          if (!data.avatar_url && !profileSyncedRef.current.has(userId)) {
            profileSyncedRef.current.add(userId);
            await syncProfileFromMetadata(userId);
          } else {
            setProfile(data);
          }
        }
      } else {
        console.error('Error fetching profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncProfileFromMetadata = async (userId: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      return;
    }

    try {
      // Get current session for access token (this is from stored session, shouldn't hang)
      const currentSession = session;
      if (!currentSession?.user?.user_metadata) {
        console.log('No user metadata available for profile sync');
        return;
      }

      const metadata = currentSession.user.user_metadata;
      const avatarUrl = metadata.picture || metadata.avatar_url || metadata.avatar;
      const displayName = metadata.full_name || metadata.name || metadata.display_name;

      if (!avatarUrl && !displayName) {
        console.log('No avatar or display name in metadata');
        return;
      }

      console.log('Syncing profile from Google metadata:', { avatarUrl, displayName });

      // Use direct REST API to update profile
      const updateUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`;
      const accessToken = currentSession.access_token;

      const updateData: Record<string, string> = {};
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (displayName) updateData.display_name = displayName;

      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedProfiles = await updateResponse.json();
        if (updatedProfiles && updatedProfiles.length > 0) {
          console.log('Profile synced successfully:', updatedProfiles[0]);
          setProfile(updatedProfiles[0]);
          return;
        }
      } else {
        console.error('Failed to update profile:', updateResponse.status);
      }

      // Fallback: fetch current profile via REST API
      const fetchUrl = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
      const fetchResponse = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (fetchResponse.ok) {
        const profiles = await fetchResponse.json();
        if (profiles && profiles.length > 0) {
          setProfile(profiles[0]);
        }
      }
    } catch (error) {
      console.error('Error syncing profile from metadata:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Google OAuth is not configured yet. Please contact the administrator.');
    }
  };

  const signOut = async () => {
    console.log('Sign out initiated...');

    try {
      // First, clear local state
      setUser(null);
      setProfile(null);
      setSession(null);

      // Clear any localStorage items related to supabase
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared localStorage auth data:', keysToRemove);

      // Sign out from Supabase with global scope to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });

      if (error) {
        console.error('Supabase sign out error:', error);
        // Don't throw, just log and proceed with redirect
      }

      console.log('Sign out successful, redirecting...');

      // Use hard reload to clear any cached state
      window.location.href = window.location.origin + '/#/';
      window.location.reload();

    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Even if there's an error, force reload
      window.location.href = window.location.origin + '/#/';
      window.location.reload();
    }
  };

  const value = React.useMemo(() => ({
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.is_admin ?? false,
    signInWithGoogle,
    signOut,
    isGuest: !user,
  }), [user, profile, session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
