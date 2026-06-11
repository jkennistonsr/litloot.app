import { useState, useEffect } from 'react';

/**
 * useDynamicGPU dynamically forces GPU hardware acceleration 
 * only during active layout changes (resize, scroll) to maintain 60fps
 * without causing persistent memory bloat.
 */
export function useDynamicGPU(debounceMs = 150) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const handleActivity = () => {
      setIsActive(true);
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIsActive(false), debounceMs);
    };

    window.addEventListener('resize', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true, capture: true });
    window.addEventListener('touchmove', handleActivity, { passive: true });
    window.addEventListener('wheel', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('resize', handleActivity);
      window.removeEventListener('scroll', handleActivity, { capture: true } as any);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('wheel', handleActivity);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return isActive ? "will-change-transform translate-z-0 force-gpu-layer" : "";
}
