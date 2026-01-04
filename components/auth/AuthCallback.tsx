import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have auth params in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAuthParams = hashParams.has('access_token') || hashParams.has('code');

        if (hasAuthParams) {
          console.log('Processing OAuth callback...');
          
          // Wait a bit for Supabase to process the session
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check if session was established
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('Session established successfully');
            // Clear the URL params and redirect to home
            navigate('/', { replace: true });
          } else {
            console.error('No session after OAuth callback');
            navigate('/', { replace: true });
          }
        } else {
          // No auth params, just redirect home
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-st-black">
      <div className="text-center">
        <Loader2 className="animate-spin text-st-red mx-auto mb-4" size={48} />
        <p className="text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
};
