'use client';

import { useRouter, Link } from '@/i18n/routing';
import { ArrowRight, Smartphone, Zap, Users, Sun, Moon, ShieldCheck, Heart, Ship } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import DragonBoatAnimation from "@/components/ui/DragonBoatAnimation";
import DragonLogo from "@/components/ui/DragonLogo";
import Footer from "@/components/ui/Footer";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [publicTeams, setPublicTeams] = useState<Array<{ name: string; icon?: string; website?: string }>>([]);

  useEffect(() => {
    // Check system preference on mount
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark); // eslint-disable-line react-hooks/set-state-in-effect

    // Fetch public teams
    fetch('/api/public/teams')
      .then(res => res.json())
      .then(data => setPublicTeams(data))
      .catch(err => console.error('Failed to fetch public teams:', err));
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // For client-side JSON-LD, use window.location.origin or explicit env variable
  const siteUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_SERVER_URL || window.location.origin)
    : (process.env.NEXT_PUBLIC_SERVER_URL || 'https://drachenboot-manager.vercel.app');

  // JSON-LD Structured Data for SEO (English/International focus)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": locale === 'de' ? "Drachenboot Manager" : "Dragon Boat Manager",
        "alternateName": locale === 'de' ? "Dragon Boat Manager" : "Drachenboot Manager",
        "url": siteUrl,
        "logo": `${siteUrl}/icons/logo-512.png`,
        "description": locale === 'de' 
          ? "Team Management Software für Drachenboot Teams" 
          : "Team Management Software for Dragon Boat Teams",
        "founder": {
          "@type": "Person",
          "name": "Jan Hartje"
        },
        "inLanguage": ["en", "de"]
      },
      {
        "@type": "WebApplication",
        "name": locale === 'de' ? "Drachenboot Manager" : "Dragon Boat Manager",
        "url": siteUrl,
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web Browser, iOS, Android",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "description": locale === 'de'
          ? "Progressive Web App zur Verwaltung von Drachenboot-Teams, Terminplanung und optimaler Bootsbesetzung"
          : "Progressive Web App for managing dragon boat teams, event planning, and optimal boat lineup",
        "featureList": locale === 'de' 
          ? [
              "Team Management",
              "Terminplanung",
              "Optimale Bootsbesetzung mit KI",
              "Gewichtstrimmung und Balance"
            ]
          : [
              "Team Management",
              "Event Planning",
              "Optimal Boat Lineup with AI",
              "Weight Trimming and Balance"
            ],
        "inLanguage": ["en", "de"],
        "availableLanguage": [
          {
            "@type": "Language",
            "name": "English",
            "alternateName": "en"
          },
          {
            "@type": "Language",
            "name": "German",
            "alternateName": "de"
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 overflow-x-hidden">
      {/* Background Gradients & Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 sm:top-4 px-0 sm:px-6">
        <div className="max-w-7xl mx-auto backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b sm:border border-slate-200/50 dark:border-slate-800/50 sm:rounded-2xl transition-all shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 sm:h-20 items-center">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <DragonLogo className="w-9 h-9 relative z-10 transition-transform group-hover:scale-110 duration-300" />
                </div>
                <span className="font-bold text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                  {t('appTitle')}
                </span>
              </div>
              <div className="flex gap-2 sm:gap-3 items-center">
                <button 
                  onClick={toggleDarkMode} 
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all hover:scale-105"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button 
                  onClick={() => router.replace('/', { locale: locale === 'de' ? 'en' : 'de' })} 
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all hover:scale-105 font-bold text-sm"
                  aria-label="Toggle language"
                >
                  {locale.toUpperCase()}
                </button>
                <Link 
                  href="/app" 
                  className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 px-5 sm:px-7 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap text-sm sm:text-base mr-2 sm:mr-0"
                >
                  <span className="hidden xs:inline">{t('landingStartApp')}</span>
                  <span className="xs:hidden">{(t('landingStartApp') as string).split(' ')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pt-52 lg:pb-32 overflow-hidden px-4" aria-label="Hero">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left">
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 sm:mb-8">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 dark:from-white dark:via-blue-200 dark:to-white">
                    {(t('landingHeroTitle') as string).split('\\n').map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                  </span>
                </h1>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm mb-8 animate-fade-in-up">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {t('landingBadge')}
                  </span>
                </div>
                
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 sm:mb-10 leading-relaxed max-w-lg">
                  {t('landingHeroSubtitle')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link 
                    href="/app" 
                    className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1 flex items-center justify-center gap-3"
                  >
                    <span>{t('landingCTA')}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a 
                    href="#features" 
                    className="px-8 py-4 rounded-full font-bold text-lg text-slate-700 dark:text-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm transition-all border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 flex items-center justify-center hover:-translate-y-1"
                  >
                    {t('landingLearnMore')}
                  </a>
                </div>
              </div>
              
              <div className="relative h-[350px] sm:h-[600px] w-full flex items-center justify-center lg:ml-auto [perspective:1000px]">
                <div className="relative w-full max-w-lg lg:max-w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 transition-transform hover:scale-[1.02] duration-500 ring-1 ring-slate-900/5">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30 dark:from-blue-900/20 dark:to-purple-900/20" />
                   <div className="relative h-full w-full p-8 flex items-center justify-center">
                      <DragonBoatAnimation />
                   </div>
                </div>
                
                {/* Decorative Elements around image */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 relative overflow-hidden" aria-label="Features">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/30 skew-y-3 transform origin-top-left scale-110" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                {t('landingFeaturesTitle')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed">
                {t('landingFeaturesSubtitle')}
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-white" />}
                iconBg="bg-amber-500"
                title={t('landingFeature1Title')}
                description={t('landingFeature1Desc')}
              />
              <FeatureCard 
                icon={<Ship className="w-6 h-6 text-white" />}
                iconBg="bg-blue-600"
                title={t('landingFeature2Title')}
                description={t('landingFeature2Desc')}
              />
              <FeatureCard 
                icon={<Smartphone className="w-6 h-6 text-white" />}
                iconBg="bg-indigo-500"
                title={t('landingFeature3Title')}
                description={t('landingFeature3Desc')}
              />
              <FeatureCard 
                icon={<Users className="w-6 h-6 text-white" />}
                iconBg="bg-emerald-500"
                title={t('landingFeature4Title')}
                description={t('landingFeature4Desc')}
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-white" />}
                iconBg="bg-slate-600"
                title={t('landingFeature5Title')}
                description={t('landingFeature5Desc')}
              />
              <FeatureCard 
                icon={<Heart className="w-6 h-6 text-white" />}
                iconBg="bg-rose-500"
                title={t('landingFeature6Title')}
                description={t('landingFeature6Desc')}
              />
            </div>
          </div>
        </section>

        {/* Public Teams Section */}
        {publicTeams.length > 0 && (
          <section className="py-24 sm:py-32 relative" aria-label="Teams using Drachenboot Manager">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  {t('landingTeamsUsing')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl leading-relaxed">
                  {t('landingTeamsUsingSubtitle')}
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
                {publicTeams.map((team, index) => (
                  <div
                    key={index}
                    className="group p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 flex flex-col items-center justify-center text-center"
                  >
                    {team.icon ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-500/50 transition-colors">
                        <img 
                          src={team.icon} 
                          alt={team.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {team.website ? (
                      <a
                        href={team.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {team.name}
                      </a>
                    ) : (
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {team.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New CTA Section */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-16 text-center text-white shadow-2xl shadow-blue-600/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">{t('landingStartApp')}</h2>
                <p className="text-blue-100 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                  {t('landingHeroSubtitle')}
                </p>
                <Link 
                  href="/app" 
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {t('landingCTA')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer variant="compact" />
    </div>
  );
}

function FeatureCard({ icon, title, description, iconBg }: { icon: React.ReactNode, title: string, description: string, iconBg: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
      <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/5 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
