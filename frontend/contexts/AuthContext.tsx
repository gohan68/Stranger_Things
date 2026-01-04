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
            await fetchProfile(session.user.id, session.user);
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
          await fetchProfile(session.user.id, session.user);
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

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, try to create it from user metadata
        const userToUse = currentUser || user;
        if (userToUse && error.code === 'PGRST116') {
          console.log('Profile not found, creating from user metadata...');
          await createProfileFromUser(userToUse);
        }
      } else if (data) {
        // Check if profile needs to be updated with Google picture
        const userToUse = currentUser || user;
        const googlePicture = userToUse?.user_metadata?.picture || userToUse?.user_metadata?.avatar_url;
        const googleName = userToUse?.user_metadata?.full_name || userToUse?.user_metadata?.name;
        
        // Update profile if avatar_url or display_name is missing but available from Google
        if ((!data.avatar_url && googlePicture) || (!data.display_name && googleName)) {
          console.log('Updating profile with Google metadata...');
          const updates: Partial<Profile> = {};
          if (!data.avatar_url && googlePicture) updates.avatar_url = googlePicture;
          if (!data.display_name && googleName) updates.display_name = googleName;
          
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();
          
          if (!updateError && updatedProfile) {
            setProfile(updatedProfile);
            return;
          }
        }
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfileFromUser = async (currentUser: User) => {
    try {
      const googlePicture = currentUser.user_metadata?.picture || currentUser.user_metadata?.avatar_url;
      const googleName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.id,
          display_name: googleName,
          avatar_url: googlePicture,
          is_admin: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
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
