'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

import { useTheme } from '@/context/ThemeContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
}

const PaymentMethodUpdateForm = ({
    onSuccess,
    onCancel
}: {
    onSuccess: () => void,
    onCancel: () => void
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required'
        });

        if (error) {
            setMessage(error.message || 'An unexpected error occurred.');
            setIsLoading(false);
        } else {
            // Success
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <PaymentElement options={{ layout: 'tabs' }} />
            {message && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {message}
                </div>
            )}
            <div className="mt-6 flex gap-3">
                <Button
                    type="submit"
                    disabled={!stripe || isLoading}
                    className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                    {t('save')}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    {t('cancel')}
                </Button>
            </div>
        </form>
    );
}

export const PaymentMethodManager = ({ teamId, currentPaymentMethod }: { teamId: string, currentPaymentMethod: PaymentMethod | undefined | null }) => {
    const { t } = useLanguage();
    const { isDarkMode } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loadingSecret, setLoadingSecret] = useState(false);

    // Reset state when teamId changes
    React.useEffect(() => {
        setIsEditing(false);
        setClientSecret(null);
        setLoadingSecret(false);
    }, [teamId]);

    const startEditing = async () => {
        setLoadingSecret(true);
        try {
            const res = await fetch('/api/stripe/setup-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamId })
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setIsEditing(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingSecret(false);
        }
    };

    const handleSuccess = () => {
        setIsEditing(false);
        // Ideally reload page or refetch subscription details to show new method
        window.location.reload();
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                {t('pro.paymentMethod')}
            </h3>

            {!isEditing ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentPaymentMethod ? (
                            <div className="flex flex-col">
                                <span className="font-medium uppercase text-slate-700 dark:text-slate-300">
                                    {currentPaymentMethod.brand} •••• {currentPaymentMethod.last4}
                                </span>
                                <span className="text-sm text-slate-500">
                                    {t('expires')} {currentPaymentMethod.expMonth}/{currentPaymentMethod.expYear}
                                </span>
                            </div>
                        ) : (
                            <span className="text-slate-500 italic">{t('pro.noPaymentMethod')}</span>
                        )}
                    </div>
                    <Button onClick={startEditing} disabled={loadingSecret} variant="outline" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {loadingSecret ? <Loader2 className="animate-spin w-4 h-4" /> : (t('pro.updatePaymentMethod') || 'Update')}
                    </Button>
                </div>
            ) : (
                clientSecret && (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: {
                                theme: isDarkMode ? 'night' : 'stripe',
                                variables: {
                                    colorPrimary: '#2563eb',
                                    borderRadius: '6px',
                                    fontFamily: 'Inter, sans-serif',
                                    colorBackground: isDarkMode ? '#1e293b' : '#ffffff',
                                    colorText: isDarkMode ? '#f8fafc' : '#1e293b',
                                },
                                rules: {
                                    '.Input': {
                                        border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                                        borderRadius: '6px',
                                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                                        color: isDarkMode ? '#f8fafc' : '#1e293b',
                                        boxShadow: 'none',
                                    },
                                    '.Input:focus': {
                                        border: '2px solid #2563eb',
                                        boxShadow: 'none',
                                    },
                                    '.Label': {
                                        color: isDarkMode ? '#94a3b8' : '#475569',
                                    }
                                }
                            },
                            locale: (t('common.locale') as 'auto') || 'de'
                        }}
                    >
                        <PaymentMethodUpdateForm
                            onSuccess={handleSuccess}
                            onCancel={() => setIsEditing(false)}
                        />
                    </Elements>
                )
            )}
        </div>
    );
};
