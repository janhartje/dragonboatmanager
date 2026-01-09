'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import DragonLogo from '@/components/ui/DragonLogo';
import Footer from '@/components/ui/Footer';
import { Link } from '@/i18n/routing';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyView() {
    const t = useTranslations('Login.verify');
    const searchParams = useSearchParams();
    const url = searchParams.get('url');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isRedirectError, setIsRedirectError] = React.useState(false);

    if (!url) {
        return (
            <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                {t('errorTitle')}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {t('errorBody')}
                            </p>
                            <Link
                                href="/login"
                                className="block w-full py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
                            >
                                {t('backToLogin')}
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleVerify = () => {
        if (!url || isLoading) return;

        setIsLoading(true);
        setIsRedirectError(false);

        // Safe relative URL check
        // Must start with / and NOT start with // (protocol relative) to avoid open redirects
        if (url.startsWith('/') && !url.startsWith('//')) {
            window.location.href = url;
            return;
        }

        try {
            const baseUrl = new URL(window.location.origin);
            // new URL(url, base) resolves relative paths against base, 
            // and simply parses absolute paths (ignoring base)
            const targetUrl = new URL(url, window.location.origin);

            if (targetUrl.origin === baseUrl.origin) {
                window.location.href = targetUrl.toString();
                return;
            } else {
                console.error('Blocked suspicious redirect. Origin mismatch:', {
                    target: targetUrl.origin,
                    current: baseUrl.origin,
                    url: url
                });
            }
        } catch (e) {
            console.error('Invalid URL during verification:', e);
        }

        setIsRedirectError(true);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <DragonLogo className="w-12 h-12" />
                            </div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                                {t('title')}
                            </h1>
                            {!isRedirectError ? (
                                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4 transition-all">
                                    <CheckCircle2 size={18} />
                                    <span className="text-sm font-medium">{t('linkValidated')}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                    <AlertCircle size={18} />
                                    <span className="text-sm font-medium">{t('redirectError')}</span>
                                </div>
                            )}
                            <p className="text-slate-600 dark:text-slate-400">
                                {t('body')}
                            </p>
                        </div>

                        <button
                            onClick={handleVerify}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${isLoading
                                ? 'bg-slate-400 cursor-not-allowed text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    ...
                                </span>
                            ) : t('cta')}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
