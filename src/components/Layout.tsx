import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, LayoutDashboard } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-midnight text-slate-800 dark:text-white transition-colors duration-300">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-amber-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">✈️</span>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Memory Capsule</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <Link
              to="/notes"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell size={16} />
              My Notes
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
            >
              <User size={16} />
              Profile
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userProfile?.photoURL ? (
              <Link to="/profile">
                <img
                  src={userProfile.photoURL}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-amber-200 dark:border-slate-600"
                />
              </Link>
            ) : (
              <Link to="/profile" className="w-9 h-9 rounded-full bg-amber-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-amber-700 dark:text-amber-300">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
