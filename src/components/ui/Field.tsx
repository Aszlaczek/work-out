import React from 'react';
import { Colors } from '@/lib/theme';

interface FieldProps {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  C: Colors;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  C,
  required,
  min,
  max,
  step,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      <label
        className="block font-display font-bold text-xs tracking-widest mb-1.5"
        style={{ color: C.muted }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 font-mono text-sm outline-none transition-all rounded-none"
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          color: C.text,
        }}
        onFocus={(e) => (e.target.style.borderColor = C.orange)}
        onBlur={(e) => (e.target.style.borderColor = C.border)}
      />
    </div>
  );
};

export const SectionTitle: React.FC<{ children: React.ReactNode; C: Colors; className?: string }> = ({
  children,
  C,
  className = '',
}) => {
  return (
    <div
      className={`font-display font-bold text-xs tracking-widest uppercase mb-3 ${className}`}
      style={{ color: C.muted }}
    >
      {children}
    </div>
  );
};
