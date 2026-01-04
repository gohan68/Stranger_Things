import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings as SettingsIcon, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from './LoginModal';

export const UserMenu: React.FC = () => {
  const { user, profile, isAdmin, signOut, isGuest } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      setShowMenu(false);
      
      console.log('Starting sign out process...');
      await signOut();
      console.log('Sign out completed');
    } catch (error) {
      console.error('Sign out failed:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {isGuest ? (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-st-red/10 hover:bg-st-red/20 border border-st-red/30 text-st-red rounded-lg transition-colors"
            data-testid="signin-button"
          >
            <User size={18} />
            <span className="hidden sm:inline text-sm font-medium">Sign In</span>
          </button>
        ) : (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="user-menu-button"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-st-red/20 flex items-center justify-center">
                <User size={18} className="text-st-red" />
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium text-gray-300">
              {profile?.display_name || 'User'}
            </span>
          </button>
        )}

        {/* Dropdown Menu */}
        {showMenu && user && (
          <div className="absolute right-0 mt-2 w-56 bg-st-charcoal border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-gray-300">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {isAdmin && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-st-red/20 text-st-red text-xs rounded">
                  <Shield size={12} />
                  <span>Admin</span>
                </div>
              )}
            </div>

            <div className="py-1">
              <button
                className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-white/5 flex items-center gap-2"
                onClick={() => {
                  setShowMenu(false);
                  // Navigate to settings (to be implemented)
                }}
              >
                <SettingsIcon size={16} />
                Settings
              </button>

              {isAdmin && (
                <button
                  className="w-full px-4 py-2 text-sm text-left text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  onClick={() => {
                    setShowMenu(false);
                    // Navigate to admin dashboard (to be implemented)
                  }}
                >
                  <Shield size={16} />
                  Admin Dashboard
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-white/5 flex items-center gap-2"
                data-testid="signout-button"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};
