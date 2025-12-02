'use client';

import Link from "next/link";
import { ArrowRight, Smartphone, Zap, Users, Sun, Moon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import DragonBoatAnimation from "@/components/ui/DragonBoatAnimation";
import DragonLogo from "@/components/ui/DragonLogo";
import Footer from "@/components/ui/Footer";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { language, changeLanguage, t } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on mount
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
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

  // JSON-LD Structured Data for SEO (English/International focus)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": language === 'de' ? "Drachenboot Manager" : "Dragon Boat Manager",
        "alternateName": language === 'de' ? "Dragon Boat Manager" : "Drachenboot Manager",
        "url": process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
        "logo": `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/icons/logo-512.png`,
        "description": language === 'de' 
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
        "name": language === 'de' ? "Drachenboot Manager" : "Dragon Boat Manager",
        "url": process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
        "applicationCategory": "SportsApplication",
        "operatingSystem": "Web Browser, iOS, Android",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "EUR"
        },
        "description": language === 'de'
          ? "Progressive Web App zur Verwaltung von Drachenboot-Teams, Terminplanung und optimaler Bootsbesetzung"
          : "Progressive Web App for managing dragon boat teams, event planning, and optimal boat lineup",
        "featureList": language === 'de' 
          ? [
              "Team Management",
              "Terminplanung",
              "Optimale Bootsbesetzung mit KI",
              "Offline-Funktionalität",
              "Gewichtstrimmung und Balance"
            ]
          : [
              "Team Management",
              "Event Planning",
              "Optimal Boat Lineup with AI",
              "Offline Functionality",
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <DragonLogo className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight">{t('appTitle')}</span>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button 
                onClick={toggleDarkMode} 
                className="p-2.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => changeLanguage(language === 'de' ? 'en' : 'de')} 
                className="p-2.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors font-bold text-sm min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                aria-label="Toggle language"
              >
                {language.toUpperCase()}
              </button>
              <Link 
                href="/app" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 sm:py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-sm sm:text-base min-h-[44px] sm:min-h-0"
              >
                <span className="hidden xs:inline">{t('landingStartApp')}</span>
                <span className="xs:hidden">{t('landingStartApp').split(' ')[0]}</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden" aria-label="Hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-8 items-center">
            <div className="relative z-10">
              <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm mb-4 sm:mb-6 border border-blue-100 dark:border-blue-800">
                {t('landingBadge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                {t('landingHeroTitle').split('\\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-lg">
                {t('landingHeroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link 
                  href="/app" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2 min-h-[52px] sm:min-h-[56px]"
                >
                  <span>{t('landingCTA')}</span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                </Link>
                <a 
                  href="#features" 
                  className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-center border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 min-h-[52px] sm:min-h-[56px] flex items-center justify-center"
                >
                  {t('landingLearnMore')}
                </a>
              </div>
            </div>
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] w-full flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
                <DragonBoatAnimation />
              </div>
              {/* Decorative Elements */}
              <div className="absolute -top-8 sm:-top-12 -right-8 sm:-right-12 w-48 sm:w-64 h-48 sm:h-64 bg-blue-400/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 sm:-bottom-12 -left-8 sm:-left-12 w-48 sm:w-64 h-48 sm:h-64 bg-purple-400/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 bg-slate-50 dark:bg-slate-900/50" aria-label="Features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{t('landingFeaturesTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              {t('landingFeaturesSubtitle')}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6 text-blue-600" />}
              title={t('landingFeature1Title')}
              description={t('landingFeature1Desc')}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title={t('landingFeature2Title')}
              description={t('landingFeature2Desc')}
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-emerald-500" />}
              title={t('landingFeature3Title')}
              description={t('landingFeature3Desc')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="compact" />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
