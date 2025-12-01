import React from 'react';
import { Info, X } from 'lucide-react';

const HelpModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white"><Info size={20} className="text-blue-500" /> Hilfe</h2>
        <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
        <section><h3 className="font-bold text-slate-900 dark:text-white mb-1">👋 Allgemein</h3><p>Verwalte dein Team und plane Bootsbesetzungen.</p></section>
        <section><h3 className="font-bold text-slate-900 dark:text-white mb-1">🛠 Tools</h3><p>Nutze den Slider für die Trimmung und den Zauberstab für Auto-Fill.</p></section>
      </div>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Verstanden</button>
      </div>
    </div>
  </div>
);

export default HelpModal;
