'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface SubscriptionHistoryItem {
  id: string;
  status: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  interval: string;
  amount: number;
  currency: string;
}

export const SubscriptionHistory = ({ history }: { history: SubscriptionHistoryItem[] }) => {
  const t = useTranslations();

  if (!history || history.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-6 py-3 font-medium">{t('pro.period')}</th>
            <th className="px-6 py-3 font-medium">{t('pro.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {history.map((sub) => {
            const startDate = sub.currentPeriodStart 
              ? new Date(sub.currentPeriodStart * 1000).toLocaleDateString() 
              : null;
            const endDate = sub.currentPeriodEnd 
              ? new Date(sub.currentPeriodEnd * 1000).toLocaleDateString() 
              : null;
            
            // For active, non-canceling subs, show "Since" instead of a fixed range
            let periodDisplay = '';
            if (sub.status === 'active' && !sub.cancelAtPeriodEnd) {
              periodDisplay = startDate ? `Seit ${startDate}` : 'Aktuell aktiv';
            } else if (startDate && endDate) {
              periodDisplay = `${startDate} - ${endDate}`;
            } else if (startDate) {
              periodDisplay = `Ab ${startDate}`;
            } else if (endDate) {
              periodDisplay = sub.cancelAtPeriodEnd ? `Läuft aus am ${endDate}` : `Bis ${endDate}`;
            } else {
              periodDisplay = 'Unbekannter Zeitraum';
            }
            
            let statusColor = 'text-slate-500';
            let StatusIcon = Clock;
            
            if (sub.status === 'active') {
                statusColor = 'text-green-600 dark:text-green-400';
                StatusIcon = CheckCircle2;
            } else if (sub.status === 'canceled') {
                statusColor = 'text-slate-400 dark:text-slate-500';
                StatusIcon = XCircle;
            }

            return (
              <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{periodDisplay}</span>
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center gap-1.5 ${statusColor} capitalize font-medium`}>
                    <StatusIcon size={14} />
                    {t(`pro.status_${sub.status}`) || sub.status}
                    {sub.cancelAtPeriodEnd && sub.status === 'active' && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-1">{t('pro.endsSoon')}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
