
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Metadata } from 'next';
import { Ship, Scale, Move, ArrowRight } from 'lucide-react';
import Footer from '@/components/ui/Footer';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  
  return {
    title: t('featureLineup.title'),
    description: t('featureLineup.description'),
    alternates: {
      canonical: `/${locale}/features/lineup-planning`,
    }
  };
}

export default async function LineupPlanningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
        {/* Simple Header */}
        <nav className="fixed w-full z-50 top-0 px-6 py-4 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <Link href="/" className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    {t('appTitle')}
                </Link>
                <Link href="/app" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full font-medium text-sm transition-transform hover:scale-105">
                    {t('landingStartApp')}
                </Link>
            </div>
        </nav>

        <main className="pt-32 pb-16 px-4">
            <div className="max-w-4xl mx-auto text-center mb-16">
                 <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white">
                    {t('featureLineup.title')}
                 </h1>
                 <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    {t('featureLineup.subtitle')}
                 </p>
                 <p className="mt-4 text-slate-500 dark:text-slate-400">
                    {t('featureLineup.description')}
                 </p>
            </div>

            <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-20">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <Scale size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{t('featureLineup.benefit1Title')}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{t('featureLineup.benefit1Desc')}</p>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                        <Ship size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{t('featureLineup.benefit2Title')}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{t('featureLineup.benefit2Desc')}</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                        <Move size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{t('featureLineup.benefit3Title')}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{t('featureLineup.benefit3Desc')}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto bg-blue-600 rounded-3xl p-12 text-center text-white shadow-xl shadow-blue-600/20">
                <h2 className="text-2xl sm:text-3xl font-bold mb-8">{t('featureLineup.cta')}</h2>
                 <Link 
                    href="/app" 
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  >
                    {t('landingStartApp')}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
            </div>
        </main>
        
        <Footer variant="compact" />
    </div>
  );
}
