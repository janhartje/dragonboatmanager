'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertModal from '@/components/ui/modals/AlertModal';

type AlertType = 'info' | 'warning' | 'success' | 'error';

interface AlertData {
  message: string;
  title?: string;
  type: AlertType;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertData | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = 'info', title?: string) => {
    setAlert({ message, type, title });
  }, []);

  const handleClose = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={!!alert}
        message={alert?.message || ''}
        title={alert?.title}
        type={alert?.type || 'info'}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
