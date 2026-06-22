import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDynamicGPU } from '../../hooks/useDynamicGPU';

interface Props {
  scrollContainerId?: string;
  className?: string;
}

export function ScrollToTopFab({ scrollContainerId = 'main-scroll-container', className }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const gpuClass = useDynamicGPU();

  useEffect(() => {
    const scrollContainer = document.getElementById(scrollContainerId) || window;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Window;
      const scrollTop = 'scrollTop' in target ? target.scrollTop : target.scrollY;
      
      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial check
    const currentContainer = scrollContainer === window ? window : scrollContainer as HTMLElement;
    const initialScrollTop = 'scrollTop' in currentContainer ? currentContainer.scrollTop : currentContainer.scrollY;
    setIsVisible(initialScrollTop > 300);

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [scrollContainerId]);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById(scrollContainerId);
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-20 sm:bottom-6 right-6 z-50 p-3 bg-surface border border-secondary/50 rounded-sm shadow-[0_0_15px_rgba(0,229,255,0.2)] text-secondary hover:bg-secondary/10 hover:scale-110 hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-95 transition-all cyber-corners",
            gpuClass,
            className
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
