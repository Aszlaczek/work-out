import React, { useEffect } from 'react';
import { Colors } from '@/lib/theme';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  C: Colors;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  C,
  maxWidth = 'max-w-md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
      style={{ background: 'rgba(5, 5, 18, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[92vh] overflow-y-auto slide-up p-5 sm:p-6 shadow-2xl rounded-t-lg sm:rounded-none`}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderTop: `2px solid ${C.orange}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
