import React from 'react';
import { Colors } from '@/lib/theme';

export const AmbientBlobs: React.FC<{ C: Colors }> = ({ C }) => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute -top-32 -left-16 w-96 h-96 rounded-full opacity-[0.07] filter blur-2xl"
        style={{ background: `radial-gradient(circle, ${C.orange}, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-32 -right-8 w-80 h-80 rounded-full opacity-[0.05] filter blur-2xl"
        style={{ background: `radial-gradient(circle, ${C.violet}, transparent 70%)` }}
      />
    </div>
  );
};
