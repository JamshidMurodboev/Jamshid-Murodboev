import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'email' | 'google' | 'apple';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('email');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const checkAndRedirect = async (uid: string) => {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists() && snap.data()?.profileComplete) {
      navigate('/dashboard');
    } else {
      navigate('/onboarding');
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      let result;
      if (mode === 'signup') {
        result = await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created!');
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
      await checkAndRedirect(result.user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      toast.error(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      toast.success('Signed in with Google!');
      await checkAndRedirect(result.user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(msg.replace('Firebase: ', '').replace(/ \(auth\/.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleApple = () => {
    toast('Apple Login coming soon!', { icon: '🍎' });
  };

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-midnight flex flex-col transition-colors duration-300">
      {/* Top bar */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <span className="font-bold text-slate-800 dark:text-white text-lg">Memory Capsule</span>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-xl bg-amber-100 dark:bg-slate-700 text-amber-700 dark:text-amber-300">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Hero text */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-3">
              Your Erasmus Story
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Capture memories, write heartfelt notes, and relive your exchange adventure
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-amber-100 dark:border-slate-700 p-8">
            {/* Auth method tabs */}
            <div className="flex gap-1 bg-amber-50 dark:bg-slate-900 rounded-2xl p-1 mb-6">
              {(['email', 'google', 'apple'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize ${
                    tab === t
                      ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'google' ? 'Google' : t === 'apple' ? '🍎 Apple' : 'Email'}
                </button>
              ))}
            </div>

            {tab === 'email' && (
              <form onSubmit={handleEmail} className="space-y-4">
                {/* Login/Signup toggle */}
                <div className="flex gap-4 mb-2">
                  {(['login', 'signup'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`text-sm font-medium pb-1 border-b-2 transition-colors capitalize ${
                        mode === m
                          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                    >
                      {m === 'login' ? 'Log In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                    placeholder="••••••••"
                  />
                </div>
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-amber-200 dark:border-slate-600 bg-amber-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
                </button>
              </form>
            )}

            {tab === 'google' && (
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>
            )}

            {tab === 'apple' && (
              <div className="text-center py-6">
                <button
                  onClick={handleApple}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm transition-colors flex items-center justify-center gap-3"
                >
                  <span>🍎</span>
                  Continue with Apple
                </button>
                <p className="text-xs text-slate-400 mt-3">Apple Sign-In coming soon</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
