'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { InvoicesList } from './InvoicesList';
import { PaymentMethodManager } from './PaymentMethodManager';
import { SubscriptionHistory } from './SubscriptionHistory';
import { AlertCircle, Sparkles } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modals';
import { UpgradeView } from '@/components/drachenboot/pro/UpgradeView';
import { Team } from '@/types';

export interface SubscriptionData {
    hasSubscription: boolean;
    isCustomer: boolean;
    isBillingUser: boolean;
    subscription: {
        id: string;
        currentPeriodEnd: number;
        cancelAtPeriodEnd: boolean;
        interval: string;
        amount: number;
        currency: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paymentMethod: any;
    } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    history: any[];
}

interface BillingContentProps {
    team: Team;
    subscription: SubscriptionData | null;
}

export const BillingContent = ({ team, subscription }: BillingContentProps) => {
    const { t } = useLanguage();
    const [actionLoading, setActionLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Case 1: No active subscription (FREE or Expired)
    if (!subscription?.hasSubscription) {
        return (
            <div className="space-y-12">
                <UpgradeView team={team} />
                
                {/* Show Invoices if they are an existing customer (have payment history) */}
                {subscription?.isCustomer && subscription?.isBillingUser && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {t('pro.viewInvoices')}
                                </h3>
                            </div>
                            <InvoicesList key={team.id} teamId={team.id} />
                        </div>

                        {subscription.history && subscription.history.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pro.subscriptionHistory')}</h3>
                                </div>
                                <SubscriptionHistory history={subscription.history} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Case 2: Active Subscription (PRO)
    const planName = 'PRO'; // We know it's PRO if hasSubscription is true

    const handleAction = async (action: 'cancel' | 'reactivate') => {
        setActionLoading(true);
        try {
            await fetch('/api/stripe/update-subscription', {
                method: 'POST',
                body: JSON.stringify({ teamId: team.id, action })
            });
            // Force reload to reflect changes
            window.location.reload(); 
        } catch (e) {
            console.error('Action failed:', e);
        } finally {
            setActionLoading(false);
            setShowCancelConfirm(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Plan Status Card */}
            <div className={`rounded-xl shadow-lg p-6 text-white relative overflow-hidden ${
                 subscription?.subscription?.cancelAtPeriodEnd 
                 ? 'bg-gradient-to-br from-amber-600 to-orange-700'
                 : 'bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900'
            }`}>
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-sm uppercase font-bold text-white/70 mb-1">{t('pro.subscriptionStatus')} • {team.name}</h2>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl font-black tracking-tight">{planName}</span>
                                {planName === 'PRO' && !subscription?.subscription?.cancelAtPeriodEnd && (
                                    <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-1 uppercase">
                                        <Sparkles size={12} fill="currentColor" />
                                        {t('pro.status_active')}
                                    </span>
                                )}
                                {subscription?.subscription?.cancelAtPeriodEnd && (
                                    <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold flex items-center gap-1 uppercase">
                                        {t('pro.status_canceled_pending') || 'Kündigung vorgemerkt'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {planName === 'PRO' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-white/70 text-sm mb-1">{t('pro.interval' + (subscription?.subscription?.interval === 'year' ? 'Yearly' : 'Monthly'))}</p>
                                <p className="text-xl font-medium">
                                    {subscription?.subscription?.amount != null ? (subscription.subscription.amount / 100).toFixed(2) : '-'} {subscription?.subscription?.currency?.toUpperCase()}
                                    <span className="text-sm text-white/50 ml-1">/{subscription?.subscription?.interval === 'year' ? t('pro.perYear') : t('pro.perMonth')}</span>
                                </p>
                            </div>
                            <div>
                                    <p className="text-white/70 text-sm mb-1">
                                        {subscription?.subscription?.cancelAtPeriodEnd ? (t('pro.validUntil') || 'Gültig bis') : t('pro.nextBillingDate')}
                                    </p>
                                    <p className="text-xl font-medium">
                                    {subscription?.subscription?.currentPeriodEnd ? new Date(subscription.subscription.currentPeriodEnd * 1000).toLocaleDateString() : '-'}
                                    </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Method & Invoices - Only for Billing User or Captain */}
            {subscription?.isBillingUser ? (
                <>
                <PaymentMethodManager 
                    key={team.id}
                    teamId={team.id} 
                    currentPaymentMethod={subscription.subscription?.paymentMethod}
                />
                
                    {/* Cancel/Reactivate Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('pro.subscription')}</h3>
                    {subscription.subscription?.cancelAtPeriodEnd ? (
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-100 dark:border-amber-900/20">
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-bold mb-1">{t('pro.subscriptionCanceled')}</p>
                                <p>{t('pro.cancelInfo')}</p>
                            </div>
                            <button
                                onClick={() => handleAction('reactivate')}
                                disabled={actionLoading}
                                className="shrink-0 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {actionLoading ? t('pro.processing') : t('pro.reactivateSubscription')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {t('pro.cancelInfo')}
                            </p>
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="shrink-0 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900/30"
                            >
                                {t('pro.cancelSubscription')}
                            </button>
                        </div>
                    )}
                    </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pro.viewInvoices')}</h3>
                        </div>
                        <InvoicesList key={team.id} teamId={team.id} />
                </div>

                {subscription.history && subscription.history.length > 0 && (
                     <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                             <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('pro.subscriptionHistory')}</h3>
                        </div>
                        <SubscriptionHistory history={subscription.history} />
                    </div>
                )}
                </>
            ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle className="shrink-0" />
                <p>{t('pro.managedByOther')}</p>
            </div>
            )}

            <ConfirmModal
                isOpen={showCancelConfirm}
                title={t('pro.cancelSubscription')}
                message={`${t('pro.confirmCancel')} ${t('pro.cancelInfo')}`}
                confirmLabel={t('pro.cancelSubscription')}
                isDestructive={true}
                onCancel={() => setShowCancelConfirm(false)}
                onConfirm={() => handleAction('cancel')}
                isLoading={actionLoading}
            />
        </div>
    );
};
