'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function DatenschutzPage() {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('legal.privacy.title')}</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.intro')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.intro_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.responsible')}</h2>
          <div className="text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-800 dark:text-slate-200">{t('legal.imprint.name')}</p>
            <p className="leading-relaxed whitespace-pre-line">{t('legal.imprint.address')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.hosting')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.hosting_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.database')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.database_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.auth')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.auth_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.emails')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.emails_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.payments')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.payments_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.analytics')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.analytics_text')}
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.privacy.rights')}</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {t('legal.privacy.rights_text')}
          </p>
        </section>
      </div>
    </div>
  );
}
