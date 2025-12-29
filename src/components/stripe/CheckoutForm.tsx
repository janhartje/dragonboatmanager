'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

export const CheckoutForm = ({ teamId, returnUrl }: { teamId: string; returnUrl?: string }) => {
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

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: returnUrl || `${window.location.origin}/app?upgrade_success=true&teamId=${teamId}`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'An unexpected error occurred.');
    } else {
      setMessage('An unexpected error occurred.');
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-slate-700 dark:text-slate-200">{t('pro.billingAddress')}</h3>
      <AddressElement options={{mode: 'billing'}} className="mb-6" />
      
      <h3 className="text-lg font-semibold mb-4 mt-6 text-slate-700 dark:text-slate-200">{t('pro.upgradeTitle')}</h3>
      <PaymentElement id="payment-element" options={{layout: "tabs"}} />
      
      {message && (
        <div id="payment-message" className="mt-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {message}
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isLoading || !stripe || !elements} 
        id="submit" 
        className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold transition-all transform hover:scale-[1.02]"
        size="lg"
      >
        {isLoading ? t('pro.processing') : t('pro.payNow')}
      </Button>
    </form>
  );
};
