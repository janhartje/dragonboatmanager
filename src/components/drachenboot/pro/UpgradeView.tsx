'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/stripe/CheckoutForm';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { Team } from '@/types';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface UpgradeViewProps {
  team: Team;
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({ team }) => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useDrachenboot();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('year');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [priceDetails, setPriceDetails] = useState<{ amount: number; currency: string; interval: string } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);   

  
  // Use a ref to access the latest promoCode without triggering re-renders of hooks
  const promoCodeRef = React.useRef(promoCode);
  useEffect(() => {
    promoCodeRef.current = promoCode;
  }, [promoCode]);

  // Use AbortController to handle request cancellation
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // 1. Initialize Setup Intent (Standard for saving card)
  const initializeSetup = React.useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setIsInitializing(true);
    setError(null);
    
    try {

        const response = await fetch('/api/stripe/create-setup-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: team.id }),
            signal: controller.signal,
        });

        if (!response.ok) throw new Error(t('pro.errors.failedToStartCheckout'));
        const data = await response.json();
        setClientSecret(data.clientSecret);
        
        // Price check is now handled by an effect triggered by clientSecret

    } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Setup error:', err);
        setError(err instanceof Error ? err.message : t('pro.errors.failedToStartCheckout'));
    } finally {
        if (abortControllerRef.current === controller) setIsInitializing(false);
    }
  }, [team.id]);

  // 2. Update Price Preview (Dry Run)
  const updatePricePreview = React.useCallback(async (interval: 'month' | 'year', code?: string) => {
    try {
        const response = await fetch('/api/stripe/preview-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                teamId: team.id, 
                interval, 
                promotionCode: code ?? promoCodeRef.current 
            }),
        });

        if (!response.ok) {
            const data = await response.json();
            if (response.status === 400 && data.error === 'Invalid promotion code') {
                 // Don't throw, just let user know code is invalid implementation logic handled in form
                 throw new Error(t('pro.invalidCode'));
            }
            throw new Error(t('pro.errors.failedToFetchPrice'));
        }

        const data = await response.json();
        setPriceDetails({
            amount: data.amount, // Total after discount
            currency: data.currency,
            interval
        });
        return true; 
    } catch (err) {
        console.error('Preview error:', err);
        throw err;
    }
  }, [team.id]);

  // 3. Finalize Subscription (Called after SetupIntent success)
  const finalizeSubscription = async (paymentMethodId: string) => {
      try {
          const response = await fetch('/api/stripe/create-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  teamId: team.id,
                  interval: billingInterval,
                  promotionCode: promoCodeRef.current || undefined,
                  paymentMethodId // Attach the verified card
              }),
          });
          
          if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || t('pro.errors.subscriptionFailed'));
          }
          
          return await response.json();
          
      } catch (error) {
          setError(error instanceof Error ? error.message : t('pro.errors.subscriptionFailed'));
          throw error; // Re-throw so CheckoutForm knows it failed
      }
  };

  useEffect(() => {
    if (team.id) {
        setClientSecret(null); // Clear old secret immediately
        initializeSetup(); 
    }
    return () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [team.id, initializeSetup, refreshTrigger]);

  // Update price when interval changes or when clientSecret is first set
  useEffect(() => {
      if (clientSecret) {
          setPriceDetails(null); // Trigger loading skeleton
          updatePricePreview(billingInterval);
      }
  }, [billingInterval, clientSecret, updatePricePreview]);

  const appearance = {
    theme: isDarkMode ? 'night' as const : 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      borderRadius: '6px',
      fontFamily: 'Inter, sans-serif',
      colorBackground: isDarkMode ? '#1e293b' : '#ffffff',
      colorText: isDarkMode ? '#f8fafc' : '#1e293b',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
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
  };
  
  const options = {
    clientSecret: clientSecret ?? undefined,
    appearance: {
        ...appearance,
        labels: 'floating' as const,
    },
    locale: language as 'de' | 'en' | 'auto',
  };

  const benefits = [
    'item1', 'item2', 'item3', 'item4', 'item5', 'item6'
  ];

  const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat(language, {
          style: 'currency',
          currency: currency,
      }).format(amount / 100);
  };

  const handleApplyPromo = async () => {
      setIsInitializing(true);
      try {
          await updatePricePreview(billingInterval);
          // Don't reset anything, just update price
      } catch {
          setError('Invalid promotion code');
          // Clear invalid code from price preview if needed, or handle UI feedback
      } finally {
          setIsInitializing(false);
      }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 md:p-8 border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
             {/* LEFT COLUMN: Benefits */}
             <div className="space-y-6 pt-2">
                 <div className="space-y-3">
                      <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold tracking-wider mb-2">
                        PREMIUM UPGRADE
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t(`pro.benefits.title`)}</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-base">
                         {t('pro.unlockFeaturesDescription')}
                      </p>
                 </div>
                 
                 <ul className="space-y-3">
                     {benefits.map((key, index) => (
                         <li key={index} className="flex items-center gap-3">
                             <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
                                 <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                 </svg>
                             </div>
                             <div>
                                 <span className="block text-base font-medium text-slate-700 dark:text-slate-200">
                                     {t(`pro.benefits.${key}`)}
                                 </span>
                             </div>
                         </li>
                     ))}
                 </ul>
            </div>

            {/* RIGHT COLUMN: Checkout Card */}
            <div className="relative">
                {/* Decorative glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-25 dark:opacity-40"></div>
                
                <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {/* Premium Top Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    
                    <div className="p-6">
                        {/* Billing Interval Toggle */}
                        <div className="flex justify-center mb-6">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                                <button
                                    onClick={() => setBillingInterval('year')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        billingInterval === 'year' 
                                        ? 'bg-white text-slate-900 border border-slate-200 shadow-sm dark:bg-slate-700 dark:text-white dark:border-slate-600' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {t('pro.intervalYearly')} <span className="text-amber-600 dark:text-amber-400 text-xs font-bold ml-1">-20%</span>
                                </button>
                                <button
                                    onClick={() => setBillingInterval('month')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        billingInterval === 'month' 
                                        ? 'bg-white text-slate-900 border border-slate-200 shadow-sm dark:bg-slate-700 dark:text-white dark:border-slate-600' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {t('pro.intervalMonthly')}
                                </button>
                            </div>
                        </div>

                        {/* Price Header */}
                        {priceDetails ? (
                            <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                    {t('pro.productName')}
                                </h3>
                                <div className="flex items-baseline justify-center gap-1 text-slate-900 dark:text-white">
                                    <span className="text-4xl font-bold tracking-tight">
                                        {formatCurrency(priceDetails.amount, priceDetails.currency).replace(/\s[A-Z]+$/, '')}
                                    </span>
                                    <span className="text-lg text-slate-500 dark:text-slate-400">
                                        / {priceDetails.interval === 'year' ? t('pro.intervalYearly') : t('pro.intervalMonthly')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto mb-3"></div>
                                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto"></div>
                            </div>
                        )}

                        {/* Stripe Form */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-center mb-4">
                                <p className="text-red-700 dark:text-red-400 text-sm mb-2">{error}</p>
                                <button 
                                    onClick={() => {
                                        setRefreshTrigger(prev => prev + 1); // Trigger re-init
                                        setError(null);
                                    }}
                                    className="text-xs font-bold text-red-600 dark:text-red-500 underline uppercase tracking-wider"
                                >
                                    {t('common.retry') || 'Retry'}
                                </button>
                            </div>
                        )}
                        
                        {clientSecret ? (
                            <div className="w-full">
                                {/* Use Setup Mode -> Key ensures fresh mount only if secret *changes* (which it shouldn't for price updates) */}
                                <Elements options={options} stripe={stripePromise} key={clientSecret}>
                                    <CheckoutForm 
                                      teamId={team.id} 
                                      returnUrl={`${window.location.origin}/app/teams/${team.id}?tab=subscription&upgrade_success=true`}
                                      promoCode={promoCode}
                                      setPromoCode={setPromoCode}
                                      onApplyPromo={handleApplyPromo}
                                      isApplyingPromo={isInitializing} // Loading state for promo button
                                      priceDetails={priceDetails}
                                      onSuccess={finalizeSubscription} // Pass callback for subscription creation
                                    />
                                </Elements>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 w-full gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                                <span className="text-xs text-slate-400 animate-pulse">{t('pro.initializingCheckout') || 'Preparing secure checkout...'}</span>
                            </div>
                        )}
                        
                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-wide">
                             <span className="flex items-center gap-1">🔒 {t('pro.securePayment') || 'SSL Encrypted & Secure Payment'}</span>
                        </div>
                    </div>
                </div>
            </div>
         </div>
    </div>
  );
};
