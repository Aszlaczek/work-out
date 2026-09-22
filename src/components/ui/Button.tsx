import React from 'react';
import { Colors } from '@/lib/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger' | 'outline' | 'violet' | 'cyan';
  small?: boolean;
  C: Colors;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled,
  variant = 'primary',
  small,
  C,
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}) => {
  const baseStyles = `font-display font-black tracking-widest transition-all select-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-1.5 ${
    small ? 'text-xs px-3 py-1.5' : 'text-sm px-5 py-2.5 min-h-[44px]'
  } ${fullWidth ? 'w-full' : ''} ${className}`;

  const styles: Record<string, React.CSSProperties> = {
    primary: { background: C.orange, color: '#ffffff' },
    ghost: { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.danger, color: '#ffffff' },
    outline: { background: 'transparent', color: C.orange, border: `1px solid ${C.orange}` },
    violet: { background: C.violet, color: '#ffffff' },
    cyan: { background: C.cyan, color: '#000000' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyles}
      style={styles[variant]}
      {...rest}
    >
      {children}
    </button>
  );
};
