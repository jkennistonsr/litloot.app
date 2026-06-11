import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  key?: React.Key;
}

export default function Tooltip({ content, children, className, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 8;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 8;
          break;
        case 'left':
          x = rect.left - 8;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 8;
          y = rect.top + rect.height / 2;
          break;
      }
      setCoords({ x, y });
    }
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  const variants = {
    top: { initial: { opacity: 0, y: 5, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 5, scale: 0.9 } },
    bottom: { initial: { opacity: 0, y: -5, scale: 0.9 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -5, scale: 0.9 } },
    left: { initial: { opacity: 0, x: 5, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 5, scale: 0.9 } },
    right: { initial: { opacity: 0, x: -5, scale: 0.9 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -5, scale: 0.9 } },
  };

  const positioningClasses = {
    top: '-translate-x-1/2 -translate-y-full mb-2',
    bottom: '-translate-x-1/2 mt-2',
    left: '-translate-x-full -translate-y-1/2 mr-2',
    right: 'ml-2 -translate-y-1/2',
  };

  return (
    <div 
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(false)}
      ref={triggerRef}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
              zIndex: 1000,
              pointerEvents: 'none'
            }}
          >
            <motion.div
              initial={variants[position].initial}
              animate={variants[position].animate}
              exit={variants[position].exit}
              transition={{ 
                type: 'spring', 
                damping: 20, 
                stiffness: 300,
                opacity: { duration: 0.1 }
              }}
              className={cn(
                "flex items-center justify-center px-3 py-1.5 bg-primary/95 backdrop-blur-xl border border-secondary/40 text-secondary text-[10px] font-mono uppercase tracking-[0.2em] text-center cyber-corners shadow-[0_0_20px_rgba(0,229,255,0.2)] whitespace-nowrap force-gpu-layer",
                positioningClasses[position]
              )}
            >
              <div className="absolute inset-0 bg-secondary/5 scanlines opacity-30" />
              <div className="relative z-10 flex items-center gap-2">
                <div className="w-1 h-1 bg-secondary animate-pulse" />
                {content}
                <div className="w-1 h-1 bg-secondary animate-pulse" />
              </div>
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-1 h-1 bg-secondary shadow-[0_0_5px_#00e5ff]" />
              <div className="absolute bottom-0 right-0 w-1 h-1 bg-secondary shadow-[0_0_5px_#00e5ff]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
