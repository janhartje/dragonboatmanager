'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Download, AlertCircle, Loader2 } from 'lucide-react';

interface Invoice {
  id: string;
  date: number;
  amount: number;
  currency: string;
  status: string;
  invoicePdf: string;
  number: string;
}

export const InvoicesList = ({ teamId }: { teamId: string }) => {
  const t = useTranslations();
  const locale = useLocale();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchInvoices = async () => {
      try {
        const response = await fetch(`/api/stripe/invoices?teamId=${teamId}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        const data = await response.json();
        setInvoices(data.invoices);
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') return;
        console.error(err);
        setError('Failed to load invoices');
      } finally {
        if (!controller.signal.aborted) {
            setLoading(false);
        }
      }
    };

    if (teamId) {
      setInvoices([]); 
      setLoading(true);
      setError(null);
      fetchInvoices();
    }
    
    return () => controller.abort();
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <AlertCircle size={20} />
        <span>{t('errorGenericMessage')}</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
        <div className="text-center p-8 text-slate-500 dark:text-slate-400">
            {t('pro.noInvoices') || 'No invoices found.'}
        </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 rounded-l-lg">{t('date')}</th>
            <th className="px-4 py-3">{t('pro.amount')}</th>
            <th className="px-4 py-3">{t('pro.status')}</th>
            <th className="px-4 py-3 rounded-r-lg text-right">{t('pro.invoice')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                {new Date(invoice.date * 1000).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                })}
              </td>
              <td className="px-4 py-3">
                {new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
                  style: 'currency',
                  currency: invoice.currency,
                }).format(invoice.amount / 100)}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  invoice.status === 'paid' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {t(`pro.status_${invoice.status}`) || invoice.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {invoice.invoicePdf && (
                  <a 
                    href={invoice.invoicePdf} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Download size={14} />
                    PDF
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
