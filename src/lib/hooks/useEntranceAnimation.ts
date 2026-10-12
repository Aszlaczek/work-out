'use client';

import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

/** Animate only opacity/transform; restore styles and stop work on unmount or preference changes. */
export function useEntranceAnimation(key: string | boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: ReturnType<typeof animate> | undefined;
    const update = () => {
      animation?.revert();
      if (!reducedMotion.matches) {
        animation = animate(element, {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 260,
          ease: 'out(3)',
        });
      }
    };
    update();
    reducedMotion.addEventListener('change', update);
    return () => {
      animation?.revert();
      reducedMotion.removeEventListener('change', update);
    };
  }, [key]);
  return ref;
}
