import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, Sparkles, Wrench, Bug } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ChangelogModalProps {
  onClose: () => void;
}

interface VersionData {
  version: string;
  features: string[];
  technical: string[];
  bugfixes: string[];
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set(['2.3.0']));

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const versions: VersionData[] = [
    {
      version: '2.3.0',
      features: [t('clV230F1'), t('clV230F2'), t('clV230F3'), t('clV230F4'), t('clV230F5'), t('clV230F6')],
      technical: [t('clV230T1')],
      bugfixes: []
    },
    {
      version: '2.2.0',
      features: [t('clV220F1'), t('clV220F2'), t('clV220F3'), t('clV220F4'), t('clV220F5'), t('clV220F6')],
      technical: [t('clV220T1'), t('clV220T2'), t('clV220T3')],
      bugfixes: [t('clV220B1')]
    },
    {
      version: '2.1.0',
      features: [t('clV210F1'), t('clV210F2'), t('clV210F3'), t('clV210F4'), t('clV210F5')],
      technical: [t('clV210T1'), t('clV210T2'), t('clV210T3')],
      bugfixes: []
    },
    {
      version: '2.0.0',
      features: [t('clV200F1'), t('clV200F2'), t('clV200F3'), t('clV200F4')],
      technical: [t('clV200T1'), t('clV200T2'), t('clV200T3')],
      bugfixes: []
    },
    {
      version: '1.7.0',
      features: [t('clV170F1'), t('clV170F2'), t('clV170F3')],
      technical: [],
      bugfixes: []
    },
    {
      version: '1.6.0',
      features: [t('clV160F1'), t('clV160F2')],
      technical: [t('clV160T1')],
      bugfixes: []
    },
    {
      version: '1.5.0',
      features: [t('clV150F1'), t('clV150F2')],
      technical: [],
      bugfixes: [t('clV150B1')]
    },
    {
      version: '1.4.0',
      features: [],
      technical: [t('clV140T1'), t('clV140T2'), t('clV140T3')],
      bugfixes: []
    },
    {
      version: '1.3.0',
      features: [t('clV130F1'), t('clV130F2'), t('clV130F3')],
      technical: [],
      bugfixes: [t('clV130B1')]
    },
    {
      version: '1.2.0',
      features: [t('clV120F1'), t('clV120F2'), t('clV120F3')],
      technical: [t('clV120T1')],
      bugfixes: []
    },
    {
      version: '1.1.0',
      features: [t('clV110F1'), t('clV110F2')],
      technical: [t('clV110T1')],
      bugfixes: []
    },
    {
      version: '1.0.0',
      features: [t('clV100F1'), t('clV100F2'), t('clV100F3'), t('clV100F4')],
      technical: [],
      bugfixes: []
    }
  ];

  const getVersionTitle = (version: string) => {
    const versionKey = version.replace(/\./g, '');
    return t(`clV${versionKey}Title`);
  };

  const getVersionDate = (version: string) => {
    const versionKey = version.replace(/\./g, '');
    return t(`clV${versionKey}Date`);
  };

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
                      <span className="font-bold text-slate-900 dark:text-white">{getVersionTitle(v.version)}</span>
                      <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{getVersionDate(v.version)}</span>
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
