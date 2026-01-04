import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './auth/LoginModal';
import { UserMenu } from './auth/UserMenu';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showAuth, setShowAuth] = React.useState(false);
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-st-black text-gray-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-st-charcoal/95 backdrop-blur border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" data-testid="logo-link">
            <BookOpen className="text-st-red group-hover:rotate-12 transition-transform" size={24} />
            <span className="font-display font-bold text-lg tracking-wider text-gray-200 hidden sm:inline">
              THE RIGHT SIDE UP
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/chapters"
              className={`font-display tracking-wide transition-colors ${
                isActive('/chapters') ? 'text-st-red' : 'text-gray-400 hover:text-gray-200'
              }`}
              data-testid="nav-chapters-link"
            >
              CHAPTERS
            </Link>
            <Link
              to="/about"
              className={`font-display tracking-wide transition-colors ${
                isActive('/about') ? 'text-st-red' : 'text-gray-400 hover:text-gray-200'
              }`}
              data-testid="nav-about-link"
            >
              ABOUT
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className={`font-display tracking-wide transition-colors flex items-center gap-1 ${
                  isActive('/admin') ? 'text-st-red' : 'text-yellow-400 hover:text-yellow-300'
                }`}
                data-testid="nav-admin-link"
              >
                <Shield size={16} />
                ADMIN
              </Link>
            )}
          </nav>

          {/* Auth & Mobile Menu */}
          <div className="flex items-center gap-3">
            <SyncStatusIndicator />
            
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-st-red/20 hover:bg-st-red/30 text-st-red border border-st-red/30 rounded-lg font-display text-sm tracking-wider transition-colors"
                data-testid="sign-in-btn"
              >
                SIGN IN
              </button>
            )}

            <button
              className="md:hidden p-2 hover:bg-white/10 rounded transition-colors"
              onClick={() => setShowMenu(!showMenu)}
              data-testid="mobile-menu-btn"
            >
              {showMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden border-t border-white/10 bg-st-charcoal" data-testid="mobile-menu">
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                to="/chapters"
                onClick={() => setShowMenu(false)}
                className={`px-4 py-2 rounded font-display tracking-wide transition-colors ${
                  isActive('/chapters')
                    ? 'bg-st-red/20 text-st-red'
                    : 'hover:bg-white/5 text-gray-400'
                }`}
              >
                CHAPTERS
              </Link>
              <Link
                to="/about"
                onClick={() => setShowMenu(false)}
                className={`px-4 py-2 rounded font-display tracking-wide transition-colors ${
                  isActive('/about')
                    ? 'bg-st-red/20 text-st-red'
                    : 'hover:bg-white/5 text-gray-400'
                }`}
              >
                ABOUT
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setShowMenu(false)}
                  className={`px-4 py-2 rounded font-display tracking-wide transition-colors flex items-center gap-2 ${
                    isActive('/admin')
                      ? 'bg-yellow-900/20 text-yellow-400'
                      : 'hover:bg-white/5 text-yellow-400'
                  }`}
                >
                  <Shield size={16} />
                  ADMIN DASHBOARD
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-st-charcoal border-t border-white/10 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p className="mb-2">
            Fan fiction based on <strong className="text-gray-400">Stranger Things</strong> created by the Duffer Brothers
          </p>
          <p className="mb-4">Non-commercial • For entertainment purposes only</p>
          <div className="flex justify-center gap-6">
            <Link to="/legal" className="hover:text-gray-300 transition-colors">
              Legal & Privacy
            </Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuth && <LoginModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};
