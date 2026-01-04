'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { CheckoutForm } from '@/components/stripe/CheckoutForm';
import { useDrachenboot } from '@/context/DrachenbootContext';
import { useLanguage } from '@/context/LanguageContext';
import { Team } from '@/types';
import { Card } from '@/components/ui/core/Card';
import { SegmentedControl } from '@/components/ui/core/SegmentedControl';
import { Badge } from '@/components/ui/core/Badge';
import { Divider } from '@/components/ui/core/Divider';

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
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [priceDetails, setPriceDetails] = useState<{ amount: number; currency: string; interval: string } | null>(null);
  
  // Use a ref to access the latest promoCode without triggering re-renders of hooks
  const promoCodeRef = React.useRef(promoCode);

  // Sync ref with state
  useEffect(() => {
    promoCodeRef.current = promoCode;
  }, [promoCode]);

  // No more manual initializeSetup. The Payment Element will use Deferred Intent mode.


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
  }, [team.id, t]);

  // 3. Finalize Subscription (Called after SetupIntent success)
  const finalizeSubscription = async (paymentMethodId: string, metadata?: Record<string, string>) => {
      try {
          const response = await fetch('/api/stripe/create-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  teamId: team.id,
                  interval: billingInterval,
                  promotionCode: promoCodeRef.current || undefined,
                  paymentMethodId, // Attach the verified card
                  metadata // Include metadata
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
    const init = async () => {
        setIsInitializing(true);
        try {
            await updatePricePreview(billingInterval);
        } finally {
            setIsInitializing(false);
        }
    };
    init();
  }, [billingInterval, updatePricePreview]);


  const appearance = {
    theme: isDarkMode ? 'night' as const : 'stripe' as const,
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
  };
  
  const options = {
    mode: 'subscription' as const,
    amount: priceDetails?.amount ?? (billingInterval === 'year' ? 5000 : 500),
    currency: priceDetails?.currency.toLowerCase() ?? 'eur',
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
          await updatePricePreview(billingInterval, promoCode);
          // Don't reset anything, just update price
      } catch {
          setError(t('pro.invalidPromoCode'));
          // Clear invalid code from price preview if needed, or handle UI feedback
      } finally {
          setIsInitializing(false);
      }
  };

  return (
    <Card className="p-4 md:p-8 border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
             {/* LEFT COLUMN: Benefits */}
             <div className="space-y-6 pt-2">
                 <div className="space-y-3">
                      <Badge variant="warning">
                        {t('pro.premiumUpgrade') || 'PREMIUM UPGRADE'}
                      </Badge>
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
                
                <Card className="relative p-0 overflow-hidden border-slate-200 dark:border-slate-800 shadow-lg">
                    {/* Premium Top Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                    
                    <div className="p-6">
                        {/* Billing Interval Toggle */}
                        <div className="flex justify-center mb-6">
                            <SegmentedControl
                                options={[
                                    { 
                                        label: (
                                            <span className="flex items-center gap-2">
                                                {t('pro.intervalYearly')} 
                                                <Badge variant="warning" size="xs" className="dark:bg-amber-900/40 dark:text-amber-400">
                                                    -20%
                                                </Badge>
                                            </span>
                                        ), 
                                        value: 'year' 
                                    },
                                    { label: t('pro.intervalMonthly'), value: 'month' }
                                ]}
                                value={billingInterval}
                                onChange={(val) => setBillingInterval(val as 'month' | 'year')}
                            />
                        </div>

                        {/* Price Header */}
                        {priceDetails ? (
                            <div className="text-center mb-6 pb-6">
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
                                <Divider className="mt-6 mb-0" />
                            </div>
                        ) : (
                            <div className="text-center mb-6 pb-6 animate-pulse">
                                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mx-auto mb-3"></div>
                                <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto"></div>
                                <Divider className="mt-6 mb-0" />
                            </div>
                        )}

                        {/* Stripe Form */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-center mb-4">
                                <p className="text-red-700 dark:text-red-400 text-sm mb-2">{error}</p>
                                <button 
                                    onClick={() => setError(null)}
                                    className="text-xs font-bold text-red-600 dark:text-red-500 underline uppercase tracking-wider"
                                >
                                    {t('common.retry') || 'Retry'}
                                </button>
                            </div>
                        )}
                        
                        <div className="w-full">
                            <Elements options={options} stripe={stripePromise}>
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
                        
                        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-wide">
                             <span className="flex items-center gap-1">🔒 {t('pro.securePayment') || 'SSL Encrypted & Secure Payment'}</span>
                        </div>
                    </div>
                </Card>
            </div>
         </div>
    </Card>
  );
};
