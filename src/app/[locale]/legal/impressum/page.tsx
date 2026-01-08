'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function ImpressumPage() {
  const t = useTranslations();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('legal.imprint.title')}</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.imprint.legal')}</h2>
        <div className="space-y-2 text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-800 dark:text-slate-200">{t('legal.imprint.name')}</p>
          <p className="leading-relaxed whitespace-pre-line">{t('legal.imprint.address')}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.imprint.contact')}</h2>
        <div className="space-y-2 text-slate-600 dark:text-slate-400">
          <p>Email: <a href={`mailto:${t('legal.imprint.email')}`} className="text-blue-600 dark:text-blue-400 hover:underline">{t('legal.imprint.email')}</a></p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">{t('legal.imprint.responsible')}</h2>
        <div className="text-slate-600 dark:text-slate-400">
          <p>{t('legal.imprint.name')}</p>
          <p className="leading-relaxed whitespace-pre-line">{t('legal.imprint.address')}</p>
        </div>
      </section>

      <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <p className="text-slate-800 dark:text-slate-200 font-medium">
          {t('legal.imprint.ustId')}
        </p>
      </section>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
          <section>
            <h3 className="text-lg font-bold mb-2">{t('legal.imprint.liability_content')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('legal.imprint.liability_content_text')}</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">{t('legal.imprint.liability_links')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('legal.imprint.liability_links_text')}</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">{t('legal.imprint.copyright')}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('legal.imprint.copyright_text')}</p>
          </section>
      </div>
    </div>
  );
}
