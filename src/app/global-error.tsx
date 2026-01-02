'use client';
 
import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <html lang="de">
      <body>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8 flex flex-col items-center gap-4">
              <svg
                viewBox="0 0 100 100"
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M 20 80 Q 30 90, 50 85 Q 70 80, 75 60 Q 80 40, 60 35 Q 40 30, 35 50 Q 30 70, 50 75"
                  className="text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  fillOpacity="0.1"
                  strokeWidth="2.5"
                />
                <path
                  d="M 60 35 Q 50 15, 30 20 Q 15 25, 25 40 Q 35 55, 55 50"
                  className="text-blue-700 dark:text-blue-300"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <circle
                  cx="32"
                  cy="28"
                  r="2.5"
                  fill="currentColor"
                  className="text-slate-800 dark:text-slate-100"
                />
                <path
                  d="M 30 20 L 25 5"
                  strokeWidth="2.5"
                  className="text-blue-800 dark:text-blue-200"
                />
                <path d="M 38 22 L 40 12" strokeWidth="2" />
                <path d="M 48 26 L 52 16" strokeWidth="2" />
                <path d="M 55 50 Q 65 55, 70 50" strokeWidth="2.5" />
                <path
                  d="M 70 50 L 75 48 M 70 50 L 76 52 M 70 50 L 74 55"
                  strokeWidth="2"
                />
                <path
                  d="M 65 45 C 65 40, 85 40, 85 45 L 85 65 C 85 70, 65 70, 65 65 Z"
                  className="text-amber-600 dark:text-amber-500"
                  fill="currentColor"
                  fillOpacity="0.2"
                  strokeWidth="2"
                />
                <line
                  x1="70"
                  y1="50"
                  x2="80"
                  y2="50"
                  strokeWidth="1.5"
                  className="text-amber-700 dark:text-amber-300"
                />
                <line
                  x1="70"
                  y1="56"
                  x2="80"
                  y2="56"
                  strokeWidth="1.5"
                  className="text-amber-700 dark:text-amber-300"
                />
                <line
                  x1="70"
                  y1="62"
                  x2="75"
                  y2="62"
                  strokeWidth="1.5"
                  className="text-amber-700 dark:text-amber-300"
                />
              </svg>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                Drachenboot Manager
              </h1>
            </div>

            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-10 h-10" />
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Kritischer Fehler / Critical Error
            </h2>
            
            <p className="text-slate-600 dark:text-slate-400 mb-4 text-lg">
              Ein kritischer Fehler ist aufgetreten und die Anwendung konnte nicht geladen werden.
            </p>
            <p className="text-slate-500 dark:text-slate-500 mb-8 italic">
              A critical error occurred and the application could not be loaded.
            </p>

            <div className="flex justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Neu laden / Reload</span>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
