import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  customHeader?: React.ReactNode;
  showCloseButton?: boolean;
  padding?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  className = '',
  customHeader,
  showCloseButton = true,
  padding = 'p-5'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[95vw] sm:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]",
        sizeClasses[size],
        className
      )}>
        {/* Header */}
        {customHeader ? customHeader : (
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
            <h2 className="font-bold text-lg text-slate-800 dark:text-white pr-4">{title}</h2>
            {showCloseButton && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 shrink-0"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn("overflow-y-auto scrollbar-thin flex-1", padding)}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
