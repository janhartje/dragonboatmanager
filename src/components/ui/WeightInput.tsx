import React from 'react';
import { Dumbbell } from 'lucide-react';

interface WeightInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const WeightInput: React.FC<WeightInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "kg", 
  className = "",
  required = false
}) => {
  return (
    <div className={`relative ${className}`}>
      <Dumbbell 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
        size={18} 
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all dark:text-white"
        placeholder={placeholder}
        step="0.1"
        min="0"
        required={required}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
        kg
      </span>
    </div>
  );
};
