'use client';

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import './swagger.css';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

const DocsPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [spec, setSpec] = React.useState<object | null>(null);

  React.useEffect(() => {
    fetch('/openapi.json')
      .then((res) => res.json())
      .then((data) => {
        // Inject dynamic server URL from environment variable
        if (process.env.NEXT_PUBLIC_SERVER_URL) {
          data.servers = [{ url: process.env.NEXT_PUBLIC_SERVER_URL }];
        }
        setSpec(data);
      })
      .catch((err) => console.error('Failed to load OpenAPI spec', err));
  }, []);

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 bg-slate-100 dark:bg-slate-950 p-2 md:p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <Header
          title="API Documentation"
          subtitle="Swagger UI"
          leftAction={
            <button onClick={() => router.push('/')} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors">
              <Home size={20} />
            </button>
          }
          showHelp={false}
          showThemeToggle={false}
        />
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {spec ? <SwaggerUI spec={spec} /> : <div className="p-8 text-center text-slate-500">Loading API Spec...</div>}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default DocsPage;
