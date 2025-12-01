import React from 'react';
import { X } from 'lucide-react';

const ChangelogModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[80vh] overflow-y-auto">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-500"><X size={20} /></button>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Changelog</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">v1.1.0 - Layout Update</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>Neues Header-Design für bessere Übersicht</li>
            <li>Footer mit Rechtlichem hinzugefügt</li>
            <li>Dark Mode Toggle verbessert</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">v1.0.0 - Initial Release</h3>
          <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-400 mt-1 space-y-1">
            <li>Team Management (Paddler anlegen/bearbeiten)</li>
            <li>Terminplanung mit Zu/Absagen</li>
            <li>Bootsbesetzung mit Drag & Drop (Auto-Fill)</li>
            <li>Gewichtstrimmung und Balance-Anzeige</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default ChangelogModal;
