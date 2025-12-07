import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Sparkles, Wrench, Bug } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChangelogModalProps {
  onClose: () => void;
}

interface VersionData {
  version: string;
  date: string;
  features: string[];
  technical: string[];
  bugfixes: string[];
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const versions: VersionData[] = t('changelogData') || [];
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(versions.length > 0 ? [versions[0].version] : []));

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  // Sort versions by semantic versioning (newest first) just in case, 
  // though JSON order should be preserved.
  // Assuming JSON is already sorted for simplicity, or we can adding a sort here if needed.
  // For now, trust the JSON order as it is easier to manage.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('changelog')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-2">
          {versions.map((v) => {
            const isExpanded = expandedVersions.has(v.version);
            const hasFeatures = v.features.length > 0;
            const hasTechnical = v.technical.length > 0;
            const hasBugfixes = v.bugfixes.length > 0;
            
            return (
              <div key={v.version} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleVersion(v.version)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <div className="text-left">
                      <span className="font-bold text-slate-900 dark:text-white">Version {v.version}</span>
                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{v.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasFeatures && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        {v.features.length} {t('clFeatures')}
                      </span>
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-4 space-y-4 bg-white dark:bg-slate-900">
                    {hasFeatures && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={16} className="text-green-500" />
                          <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">{t('clFeatures')}</h4>
                        </div>
                        <ul className="space-y-1.5 ml-6">
                          {v.features.map((item, i) => (
                            <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {hasTechnical && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench size={16} className="text-blue-500" />
                          <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">{t('clTechnical')}</h4>
                        </div>
                        <ul className="space-y-1.5 ml-6">
                          {v.technical.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {hasBugfixes && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bug size={16} className="text-amber-500" />
                          <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">{t('clBugfixes')}</h4>
                        </div>
                        <ul className="space-y-1.5 ml-6">
                          {v.bugfixes.map((item, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-800/50">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
