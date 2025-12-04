import React from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border rounded-lg outline-none transition-all text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600",
          error 
            ? "border-red-500 ring-1 ring-red-500" 
            : "border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
          className
        )}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
