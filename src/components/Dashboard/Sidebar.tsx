import { LayoutGrid, ShoppingCart, History, Zap, Settings, HelpCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { View } from '../../App';
import Tooltip from '../ui/Tooltip';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
  onSettingsOpen: () => void;
}

export default function Sidebar({ isOpen, onClose, currentView, onViewChange, onSettingsOpen }: SidebarProps) {
  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard' as View, desc: 'Overview' },
    { icon: ShoppingCart, label: 'Marketplace' as View, desc: 'Browse' },
    { icon: History, label: 'History' as View, desc: 'Purchases' },
    { icon: Zap, label: 'Live Drops' as View, desc: 'Live Stream' },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="pb-6 mb-6 border-b border-text-main/10 relative">
        <div className="flex items-center justify-between lg:block">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-secondary rounded-sm glow-cyan-sm animate-pulse"></div>
            <div className="text-xl font-black tracking-widest text-secondary text-glow uppercase">
              LITLOOT
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 text-text-dim hover:text-secondary transition-colors bg-text-main/5 rounded-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[7px] font-mono uppercase tracking-[0.4em] text-text-dim mt-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-secondary rotate-45" />
            <span>Navigation</span>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-secondary/20 to-transparent" />
        </div>
      </div>
      
      {/* Body Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Tooltip key={item.label} content={item.desc} position="right" className="w-full">
              <button
                onClick={() => {
                  onViewChange(item.label);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-mono tracking-widest uppercase transition-all text-left w-full relative overflow-hidden group",
                  currentView === item.label 
                    ? "bg-secondary/10 text-secondary cyber-corners border border-secondary/30 shadow-[0_0_15px_rgba(0,243,255,0.05)]" 
                    : "text-text-dim hover:text-text-main hover:bg-text-main/5 border border-transparent"
                )}
              >
                {/* Visual hardware accent */}
                <div className={cn(
                  "absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors",
                  currentView === item.label ? "border-secondary/50" : "border-transparent group-hover:border-text-main/20"
                )} />
                <div className={cn(
                  "absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors",
                  currentView === item.label ? "border-secondary/50" : "border-transparent group-hover:border-text-main/20"
                )} />
                <item.icon className={cn("w-4 h-4", currentView === item.label ? "text-secondary" : "text-text-dim group-hover:text-text-main")} />
                {item.label}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      {/* Footer Section */}
      <div className="pt-6 mt-auto border-t border-text-main/10 relative">
        {/* Decorative corner markers */}
        <div className="absolute top-0 left-0 w-2 h-[1px] bg-secondary/30" />
        <div className="absolute top-0 right-0 w-2 h-[1px] bg-secondary/30" />

        <div className="flex flex-col gap-2">
          <Tooltip content="Help Documentation" position="top" className="w-full">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-sm bg-primary/50 border border-text-main/10 shadow-inner text-text-dim hover:text-secondary hover:border-secondary/30 transition-all hover:bg-secondary/5 group w-full text-left">
              <HelpCircle className="w-4 h-4 transition-colors" />
              <span className="text-[10px] font-mono uppercase tracking-widest leading-none">Help</span>
            </a>
          </Tooltip>
          <Tooltip content="Config & Security" position="top" className="w-full">
            <button 
              onClick={onSettingsOpen}
              className="flex items-center gap-3 px-4 py-3 rounded-sm bg-primary/50 border border-text-main/10 shadow-inner text-text-dim hover:text-secondary hover:border-secondary/30 transition-all hover:bg-secondary/5 group w-full text-left"
            >
              <Settings className="w-4 h-4 group-hover:animate-spin-slow transition-colors" />
              <span className="text-[10px] font-mono uppercase tracking-widest leading-none">Settings</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[240px] glass-panel border-r border-border-glow p-8 flex flex-col gap-8 hidden lg:flex z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-primary/95 backdrop-blur-md z-[60] lg:hidden touch-none"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-border-glow p-8 z-[70] lg:hidden flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
