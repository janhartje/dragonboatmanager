'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function AGBPage() {
  const t = useTranslations();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.scope')}</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('legal.tos.scope_text')}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.subject')}</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('legal.tos.subject_text')}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.conclusion')}</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('legal.tos.conclusion_text')}
        </p>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.withdrawal')}</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{t('legal.tos.withdrawal_policy')}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-300 dark:border-slate-700 pl-4">
              {t('legal.tos.withdrawal_text')}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">{t('legal.tos.withdrawal_expiry')}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('legal.tos.withdrawal_expiry_text')}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.prices')}</h2>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('legal.tos.prices_text')}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.term')}</h2>
        <div className="space-y-2 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>{t('legal.tos.term_text1')}</p>
          <p>{t('legal.tos.term_text2')}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.tos.liability')}</h2>
        <div className="space-y-2 text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>{t('legal.tos.liability_text1')}</p>
          <p>{t('legal.tos.liability_text2')}</p>
        </div>
      </section>
    </div>
  );
}
