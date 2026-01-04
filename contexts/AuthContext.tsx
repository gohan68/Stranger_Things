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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        // If profile exists but avatar_url is missing, try to sync from user metadata
        if (data && !data.avatar_url) {
          await syncProfileFromMetadata(userId);
        } else {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncProfileFromMetadata = async (userId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.user_metadata) {
        const avatarUrl = authUser.user_metadata.picture || 
                         authUser.user_metadata.avatar_url || 
                         authUser.user_metadata.avatar;
        
        const displayName = authUser.user_metadata.full_name || 
                           authUser.user_metadata.name || 
                           authUser.user_metadata.display_name;

        if (avatarUrl || displayName) {
          console.log('Syncing profile from Google metadata:', { avatarUrl, displayName });
          
          // Update the profile with Google data
          const { data: updatedProfile, error } = await supabase
            .from('profiles')
            .update({
              avatar_url: avatarUrl || undefined,
              display_name: displayName || undefined,
            })
            .eq('id', userId)
            .select()
            .single();

          if (error) {
            console.error('Error updating profile:', error);
            // Fetch the profile anyway
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            setProfile(data);
          } else {
            setProfile(updatedProfile);
          }
        } else {
          // No metadata to sync, just use existing profile
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error syncing profile from metadata:', error);
      // Fallback to fetching the profile
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data);
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Clear local state immediately
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Redirect to home page after successful logout
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, try to clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.href = '/';
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.is_admin ?? false,
    signInWithGoogle,
    signOut,
    isGuest: !user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
