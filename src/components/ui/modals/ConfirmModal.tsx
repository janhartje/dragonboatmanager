import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { THEME_MAP, ThemeKey } from '@/constants/themes';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  primaryColor?: string;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel,
  cancelLabel,
  isDestructive = false,
  primaryColor,
  isLoading = false
}) => {
  const { t } = useLanguage();
  const theme = primaryColor ? THEME_MAP[primaryColor as ThemeKey] : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-300">{message}</p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {cancelLabel || t('cancel')}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-bold text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
                : (theme?.button || 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800')
            }`}
          >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {confirmLabel || t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
