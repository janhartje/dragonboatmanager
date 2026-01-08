'use client';

import React, { useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { signIn } from 'next-auth/react';
import DragonLogo from '@/components/ui/DragonLogo';
import { ArrowLeft, Loader2, Key } from 'lucide-react';

const TestLoginView: React.FC = () => {
  const router = useRouter();
  
  const [email, setEmail] = useState('test@drachenbootmanager.de');
  const [password, setPassword] = useState('testuser123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', { 
        email, 
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Login failed. Check credentials or ensure you are in a dev/test environment.');
        setIsLoading(false);
      } else {
        router.push('/app');
        router.refresh();
      }
    } catch (error) {
      console.error('Error signing in:', error);
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back to Home</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DragonLogo className="w-12 h-12 text-amber-600 dark:text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                Test User Login
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                This login is only available in Development and Test environments.
              </p>
            </div>

            <form onSubmit={handleCredentialsSignIn} className="mb-6 space-y-4">
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@drachenbootmanager.de"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="text-left">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    <span>Login as Test User</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestLoginView;
