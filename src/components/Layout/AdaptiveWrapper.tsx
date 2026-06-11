import React, { useState, useEffect } from 'react';
import { useDynamicGPU } from '../../hooks/useDynamicGPU';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AdaptiveWrapperProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  logo?: React.ReactNode;
  brandName?: string;
  className?: string;
}

export function AdaptiveWrapper({
  children,
  navItems,
  activeId,
  onNavigate,
  logo,
  brandName = "APP",
  className
}: AdaptiveWrapperProps) {
  const gpuClass = useDynamicGPU();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 10); // micro-debounce ensures sizing calculations don't flood the main thread
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isCompact = windowWidth < 600;
  const isExpanded = windowWidth >= 840;

  return (
    <div className={cn("min-h-screen w-full bg-primary flex overflow-hidden", gpuClass, className)}>
      {/* Navigation Rails (Medium/Expanded) */}
      {!isCompact && (
        <aside className={cn(
          "flex-shrink-0 bg-surface border-r border-secondary/20 z-40 relative flex flex-col pt-6 pb-6 h-screen transition-[width] duration-300 ease-in-out", 
          isExpanded ? "w-64" : "w-20"
        )}>
          {/* Brand Area */}
          <div className={cn("flex items-center mb-10 transition-all duration-300", isExpanded ? "px-6" : "px-0 justify-center")}>
            {logo || (
              <div className="w-8 h-8 rounded-sm bg-secondary/10 border border-secondary flex items-center justify-center glow-cyan shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:scale-110 transition-transform active:scale-95 cursor-pointer">
                <span className="text-secondary font-black font-mono text-sm leading-none">
                  {brandName.charAt(0)}
                </span>
              </div>
            )}
            {isExpanded && (
              <h1 className="ml-3 font-display font-black text-xl tracking-widest text-text-main uppercase italic glow-cyan-sm truncate animate-in fade-in slide-in-from-left-2 duration-300">
                {brandName}
              </h1>
            )}
          </div>

          {/* Nav Items */}
          <div className="flex-1 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "relative flex items-center border border-transparent py-3 transition-all duration-200 cyber-corners group overflow-hidden force-gpu-layer",
                    isExpanded ? "px-4 justify-start gap-4" : "justify-center px-0",
                    isActive 
                      ? "bg-secondary/10 border-secondary/40 text-secondary shadow-[inset_0_0_15px_rgba(0,229,255,0.05)]" 
                      : "text-text-dim hover:bg-secondary/5 hover:text-text-main hover:border-secondary/20"
                  )}
                  aria-label={item.label}
                >
                  {isActive && (
                    <div className="absolute inset-x-0 inset-y-0 bg-secondary/5 scanlines opacity-20" />
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-secondary glow-cyan" />
                  )}
                  
                  <Icon className={cn("w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-300", isActive ? "glow-cyan-sm scale-110" : "group-hover:scale-110 group-hover:text-secondary")} />
                  {isExpanded && (
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest truncate relative z-10">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={cn(
            "mt-auto pt-4 border-t border-secondary/5 flex flex-col items-center pb-6",
            isExpanded ? "px-6 items-end" : "px-2"
          )}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm border border-secondary/10 bg-secondary/5 transition-all duration-300 hover:border-secondary/30 max-w-full overflow-hidden">
              <div className="w-1 h-1 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(0,229,255,1)] flex-shrink-0" />
              <span className="text-[8px] font-mono font-black tracking-[0.1em] text-secondary/70 uppercase select-none whitespace-nowrap truncate">
                1.0.42
              </span>
            </div>
          </div>
        </aside>
      )}

      {/* Core Content Layer */}
      <main className={cn("flex-1 flex flex-col h-screen overflow-hidden relative", gpuClass)}>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-primary scroll-smooth overscroll-behavior-none">
           {/* Mobile spatial logic explicitly pads bottom to prevent overlap with the Compact Bottom Nav */}
           <div className={cn("min-h-full flex flex-col relative", isCompact && "pb-[80px]", gpuClass)}>
              {children}
           </div>
        </div>
      </main>

      {/* Bottom Nav (Compact) */}
      {isCompact && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-md border-t border-secondary/20 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] will-change-transform translate-z-0 force-gpu-layer">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                  isActive ? "text-secondary" : "text-text-dim"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-sm flex items-center justify-center transition-transform cyber-corners",
                  isActive ? "bg-secondary/10 border border-secondary/30 glow-cyan-sm scale-110" : "border border-transparent hover:bg-surface"
                )}>
                  <Icon className={cn("w-4 h-4", isActive && "glow-cyan-sm")} />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest line-clamp-1 truncate px-1 mt-0.5">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
