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
        if (!url) return;

        try {
            const baseUrl = new URL(window.location.origin);
            const targetUrl = new URL(url, window.location.origin);

            // Only allow redirects to the same origin
            if (targetUrl.origin === baseUrl.origin) {
                window.location.href = url;
                return;
            }
        } catch (e) {
            console.error('Invalid URL during verification:', e);
        }

        console.error('Blocked suspicious redirect to:', url);
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
                            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
                                <CheckCircle2 size={18} />
                                <span className="text-sm font-medium">Link validiert</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                {t('body')}
                            </p>
                        </div>

                        <button
                            onClick={handleVerify}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {t('cta')}
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
