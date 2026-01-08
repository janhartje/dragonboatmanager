'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement,  } from '@stripe/react-stripe-js';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

export interface CheckoutFormProps {
  teamId: string;
  returnUrl?: string;
  promoCode?: string;
  setPromoCode?: (code: string) => void;
  onApplyPromo?: () => void;
  isApplyingPromo?: boolean;
  priceDetails?: { amount: number; currency: string; interval: string } | null;
  onSuccess?: (paymentMethodId: string, metadata?: Record<string, string>) => Promise<{ clientSecret: string | null }>;
}

export const CheckoutForm = ({ 
  teamId, 
  returnUrl, 
  promoCode, 
  setPromoCode, 
  onApplyPromo, 
  isApplyingPromo,
  priceDetails,
  onSuccess
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations();
  const locale = useLocale();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    // 1. Submit Elements (validates input)
    const { error: submitError } = await elements.submit();
    if (submitError) {
        console.error('Stripe submit error:', submitError);
        setMessage(submitError.message || t('pro.stripe.errors.default'));
        setIsLoading(false);
        return;
    }

    // 2. Create Subscription on Backend
    // This returns the clientSecret for the PaymentIntent (or SetupIntent if Trial)
    if (onSuccess) {
        try {
            const now = new Date().toISOString();
            const metadata = {
                agb_consent: now,
                revocation_waiver: now
            };

            const subResult = await onSuccess('', metadata); // No PM ID needed yet, Elements will handle it
            
            if (subResult && subResult.clientSecret) {
                const secret = subResult.clientSecret as string;
                
                // 3. Confirm the Intent directly using Elements
                // This handles 3DS challenge exactly once "directly there"
                let result;
                if (secret.startsWith('pi_')) {
                    result = await stripe.confirmPayment({
                        elements,
                        clientSecret: secret,
                        confirmParams: {
                            return_url: returnUrl || `${window.location.origin}/${locale}/app?upgrade_success=true&teamId=${teamId}`,
                        },
                    });
                } else if (secret.startsWith('seti_')) {
                    result = await stripe.confirmSetup({
                        elements,
                        clientSecret: secret,
                        confirmParams: {
                            return_url: returnUrl || `${window.location.origin}/${locale}/app?upgrade_success=true&teamId=${teamId}`,
                        },
                    });
                } else {
                    // Fallback
                    result = await stripe.confirmPayment({
                        elements,
                        clientSecret: secret,
                        confirmParams: {
                            return_url: returnUrl || `${window.location.origin}/${locale}/app?upgrade_success=true&teamId=${teamId}`,
                        },
                    });
                }

                if (result.error) {
                     const errorCode = result.error.decline_code || result.error.code || result.error.type;
                     const translatedMessage = t(`pro.stripe.errors.${errorCode}`);
                     
                     if (translatedMessage !== `pro.stripe.errors.${errorCode}`) {
                         setMessage(translatedMessage);
                     } else {
                         setMessage(result.error.message || t('pro.stripe.errors.default'));
                     }
                     setIsLoading(false);
                     return;
                }
            } else {
                // No secret returned? If status is active, just redirect
                window.location.href = returnUrl || `${window.location.origin}/${locale}/app?upgrade_success=true&teamId=${teamId}`;
            }
            
        } catch (err) {
             console.error('Subscription creation/confirmation error:', err);
             // Error state usually set in parent
        }
    } else {
        console.error('Missing onSuccess callback');
        setMessage(t('pro.stripe.errors.missingConfig'));
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">{t('pro.billingAddress')}</h3>
      <div className="relative z-30 mb-6">
        <AddressElement options={{mode: 'billing'}} />
      </div>

      {/* Promotion Code Section */}
        <div className="mb-6 relative">
             {/* Floating Label Input Container */}
            <div className="relative flex items-center group">
                <input
                    type="text"
                    id="promoCode"
                    value={promoCode || ''}
                    onChange={(e) => setPromoCode && setPromoCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (onApplyPromo) onApplyPromo();
                        }
                    }}
                    placeholder=" " // Required for peer-placeholder-shown to work
                    className="block px-3 pb-2 pt-6 w-full text-[16px] text-slate-900 bg-transparent rounded-[6px] border border-slate-200 appearance-none dark:text-white dark:border-slate-700 focus:outline-none focus:ring-0 focus:border-[#2563eb] peer h-[58px] transition-colors antialiased"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                />
                <label 
                    htmlFor="promoCode" 
                    className="absolute text-slate-600 dark:text-slate-400 duration-200 transform -translate-y-[14px] scale-[0.85] top-[22px] z-10 origin-[0] start-3 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.85] peer-focus:-translate-y-[14px] peer-focus:text-[#2563eb] cursor-text pointer-events-none antialiased"
                    style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                    {t('pro.promotionCode') || 'Promotion Code'}
                </label>
                
                <div className="absolute right-2 top-2 bottom-2 z-20">
                     <button
                        type="button"
                        onClick={onApplyPromo}
                        disabled={!promoCode || isApplyingPromo}
                        className="h-full px-4 text-xs font-semibold bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        {isApplyingPromo ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            t('common.apply') || 'Apply'
                        )}
                    </button>
                </div>
            </div>
            
             {/* Success Message for Discount */}
             {priceDetails && priceDetails.amount < (priceDetails.interval === 'year' ? 5000 : 500) && promoCode && (
                <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('pro.discountApplied') || 'Discount applied!'}
                </div>
            )}
        </div>
      
      <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">{t('pro.upgradeTitle')}</h3>
      <PaymentElement id="payment-element" options={{layout: "tabs"}} />
      
      <div className="mt-6 space-y-3">
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          <input 
            type="checkbox" 
            required
            className="mt-1 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 bg-transparent"
          />
          <span dangerouslySetInnerHTML={{ 
            __html: (t('legal.agbConsent') || 'I agree to the <a href="/{lang}/legal/agb" target="_blank" class="underline">AGB</a> and <a href="/{lang}/legal/datenschutz" target="_blank" class="underline">Privacy Policy</a>.')
            .replace('[AGB]', `<a href="/${locale}/legal/agb" target="_blank" class="underline">AGB</a>`)
            .replace('[Datenschutzerklärung]', `<a href="/${locale}/legal/datenschutz" target="_blank" class="underline">Datenschutzerklärung</a>`)
            .replace('[Privacy Policy]', `<a href="/${locale}/legal/datenschutz" target="_blank" class="underline">Privacy Policy</a>`)
            .replace('/{lang}/', `/${locale}/`) // Fallback for the default english string if t() fails
          }} />
        </label>

        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
          <input 
            type="checkbox" 
            required
            className="mt-1 rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500 bg-transparent"
          />
          <span className="text-xs">
            {t('legal.revocationWaiver') || 'I agree that the execution of the contract begins before the expiration of the withdrawal period and I lose my right of withdrawal.'}
          </span>
        </label>
      </div>

      {message && (
        <div id="payment-message" className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {message}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || isApplyingPromo || !stripe || !elements} 
        id="submit" 
        className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold transition-all transform hover:scale-[1.02]"
        size="lg"
      >
        <span className="flex flex-col items-center leading-tight">
            <span>{isLoading || isApplyingPromo ? t('pro.processing') : t('pro.payNow')}</span>
            {!isLoading && !isApplyingPromo && (
                <span className="text-[10px] font-normal opacity-80">{t('pro.vatIncluded')}</span>
            )}
        </span>
      </Button>
    </form>
  );
};
