import React from 'react';
import { Colors } from '@/lib/theme';

interface ToggleProps {
  value: string;
  onChange: (v: string) => void;
  optA: { val: string; label: string };
  optB: { val: string; label: string };
  C: Colors;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onChange,
  optA,
  optB,
  C,
  className = '',
}) => {
  return (
    <div className={`flex ${className}`} style={{ border: `1px solid ${C.border}` }}>
      {[optA, optB].map((o) => (
        <button
          key={o.val}
          type="button"
          onClick={() => onChange(o.val)}
          className="flex-1 font-display font-bold text-xs tracking-widest py-2 px-3 transition-all select-none"
          style={{
            background: value === o.val ? C.orange : 'transparent',
            color: value === o.val ? '#ffffff' : C.muted,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
};
