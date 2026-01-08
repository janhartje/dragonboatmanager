'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function WiderrufsrechtPage() {
  const t = useTranslations();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
        {t('legal.revocation.title')}
      </h1>

      <div className="space-y-8">
        <section>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.revocation.intro')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
            {t('legal.revocation.right.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.revocation.right.content')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
            {t('legal.revocation.expiry.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.revocation.expiry.content')}
          </p>
        </section>

        <section className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
            {t('legal.revocation.form.title')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-slate-300 dark:border-slate-700 pl-4 whitespace-pre-line">
            {t('legal.revocation.form.content')}
          </p>
        </section>
        
        <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {t('legal.stand')}
          </p>
        </section>
      </div>
    </div>
  );
}
