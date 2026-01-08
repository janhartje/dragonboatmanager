import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { THEME_MAP, ThemeKey } from '@/constants/themes';
import { Modal } from '../core/Modal';

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
  const t = useTranslations();
  const theme = primaryColor ? THEME_MAP[primaryColor as ThemeKey] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={
        <>
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
        </>
      }
    >
      <p className="text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  );
};

export default ConfirmModal;
