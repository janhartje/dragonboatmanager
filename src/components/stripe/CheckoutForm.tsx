'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement,  } from '@stripe/react-stripe-js';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export interface CheckoutFormProps {
  teamId: string;
  returnUrl?: string;
  promoCode?: string;
  setPromoCode?: (code: string) => void;
  onApplyPromo?: () => void;
  isApplyingPromo?: boolean;
  priceDetails?: { amount: number; currency: string; interval: string } | null;
  onSuccess?: (paymentMethodId: string) => Promise<{ clientSecret: string | null }>;
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
  const { t } = useLanguage();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/app?upgrade_success=true&teamId=${teamId}`,
      },
      redirect: 'if_required', // Avoid redirect if possible
    });

    if (error) {
      // Display the actual error message from Stripe
      console.error('Stripe setup error:', error);
      
      // Try to translate based on decline_code, then error code, then type
      const errorCode = error.decline_code || error.code || error.type;
      const translatedMessage = t(`pro.stripe.errors.${errorCode}`);
      
      if (translatedMessage !== `pro.stripe.errors.${errorCode}`) {
        setMessage(translatedMessage);
      } else {
        // Fallback: If no translation for specific code, use the one from Stripe 
        // but only if it exists, otherwise our generic default
        setMessage(error.message || t('pro.stripe.errors.default'));
      }
    } else if (setupIntent && setupIntent.status === 'succeeded') {
        // SUCCESS: Valid card setup!
        // Now call the parent to create the subscription
        if (onSuccess && typeof setupIntent.payment_method === 'string') {
            try {
                // 1. Create Subscription
                const subResult = await onSuccess(setupIntent.payment_method);
                
                // 2. Handle Potential SCA (3D Secure)
                // 2. Handle Potential SCA (3D Secure)
                if (subResult && subResult.clientSecret) {
                    const secret = subResult.clientSecret as string;

                    
                    let confirmError;
                    
                    if (secret.startsWith('pi_')) {
                        // PaymentIntent
                         const result = await stripe.confirmCardPayment(secret);
                         confirmError = result.error;
                    } else if (secret.startsWith('seti_')) {
                        // SetupIntent (e.g. Trial)
                         const result = await stripe.confirmCardSetup(secret);
                         confirmError = result.error;
                    } else {
                        // Fallback or unknown
                        console.warn('Unknown secret format, attempting confirmCardPayment');
                        const result = await stripe.confirmCardPayment(secret);
                        confirmError = result.error;
                    }
                    
                    if (confirmError) {
                         const errorCode = confirmError.decline_code || confirmError.code || confirmError.type;
                         const translatedMessage = t(`pro.stripe.errors.${errorCode}`);
                         
                         if (translatedMessage !== `pro.stripe.errors.${errorCode}`) {
                             setMessage(translatedMessage);
                         } else {
                             setMessage(confirmError.message || t('pro.stripe.errors.default'));
                         }
                         setIsLoading(false);
                         return; // Stop here
                    }
                }
                
                // 3. Final Success Redirect
                window.location.href = returnUrl || `${window.location.origin}/app?upgrade_success=true&teamId=${teamId}`;
                
            } catch (err) {
                 // Error already handled/set in parent mostly, but we catch here to stop loading
                 console.error('Subscription creation error:', err);
                 // Parent `onSuccess` sets parent error state, but we might want to set local message too?
                 // For now, parent error display is enough, just stop loading.
            }
        } else {
            console.error('Missing payment method ID');
            setMessage('Interner Fehler: Zahlungsmethode nicht gefunden.');
        }
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
        {isLoading || isApplyingPromo ? t('pro.processing') : t('pro.payNow')}
      </Button>
    </form>
  );
};
