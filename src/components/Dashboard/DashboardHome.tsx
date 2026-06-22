import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { Shield, Zap, ShoppingBag, ArrowRight } from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { cn } from '../../lib/utils';

interface DashboardHomeProps {
  onGoToMarket: () => void;
}

export default function DashboardHome({ onGoToMarket }: DashboardHomeProps) {
  const user = useAuthStore(state => state.user);
  const username = user?.displayName || user?.email?.split('@')[0] || 'USER';
  
  const { items: recentItems, loading: recentLoading, initialize: initRecent } = useRecentlyViewedStore();

  useEffect(() => {
    initRecent();
  }, [initRecent]);

  return (
    <div className="space-y-10 md:space-y-14">
      {/* Hero Welcome */}
      <section className="relative py-8 md:py-12 border-b border-secondary/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse glow-cyan-sm" />
            <span className="text-secondary font-mono text-[10px] uppercase tracking-widest">System Online</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-black uppercase text-text-main leading-none pr-8">
            WELCOME,<br />
            <span className="text-secondary text-glow break-words">{username}</span>
          </h1>
          <p className="text-text-dim max-w-lg text-[11px] sm:text-xs md:text-sm leading-relaxed font-mono tracking-wide">
            Secure neural link established. Explore the latest artifacts in the marketplace or access your recent activity logs.
          </p>
        </motion.div>
      </section>

      {/* Grid Stats / Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: Shield, label: 'Auth Status', value: 'Verified', color: 'text-secondary', tooltip: 'Security protocols active' },
          { icon: Zap, label: 'Sync Rate', value: '100%', color: 'text-accent-pink', tooltip: 'Connection stability' },
          { icon: ShoppingBag, label: 'Recent Scans', value: recentLoading ? '...' : recentItems.length.toString(), color: 'text-text-main', tooltip: 'Artifacts recently scanned' },
        ].map((stat, idx) => (
          <Tooltip key={idx} content={stat.tooltip} position="top" className={cn("w-full", idx === 2 && "col-span-2 md:col-span-1")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="cyber-panel p-5 md:p-6 relative group h-full cursor-help transition-all duration-300 hover:border-secondary/40 hover:bg-surface/90"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-secondary/5 border border-secondary/10 group-hover:bg-secondary/10 group-hover:border-secondary/30 transition-all rounded-sm">
                  <stat.icon className={stat.color + " w-4 h-4 md:w-5 md:h-5"} />
                </div>
                <div className="w-1.5 h-1.5 bg-secondary/20 rounded-full group-hover:bg-secondary group-hover:glow-cyan-sm transition-colors" />
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-text-dim uppercase tracking-[0.2em]">{stat.label}</div>
                <div className="text-2xl md:text-3xl font-display font-black text-text-main tracking-tight truncate">{stat.value}</div>
              </div>
            </motion.div>
          </Tooltip>
        ))}
      </div>

      {/* Quick Actions / Recent Activity */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-secondary/10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-secondary rotate-45" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-[0.2em] text-text-main">Recently Viewed</h2>
          </div>
          <button 
            onClick={onGoToMarket}
            className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-text-dim hover:text-secondary transition-colors flex items-center gap-2 group"
          >
            VIEW ALL <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentLoading ? (
            // Loading Skeletons
            [1, 2].map((i) => (
              <div key={i} className="cyber-panel p-3 flex gap-4 items-center group shadow-none">
                <div className="w-16 h-16 bg-primary/50 border border-secondary/10 overflow-hidden flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-text-main/10 animate-pulse" />
                  <div className="h-3 w-20 bg-text-main/5 animate-pulse" />
                </div>
              </div>
            ))
          ) : recentItems.length > 0 ? (
            recentItems.slice(0, 4).map((item) => (
              <div key={item.id} className="cyber-panel p-3 flex gap-4 items-center group transition-all duration-300 hover:border-secondary/40 cursor-pointer shadow-none hover:shadow-lg hover:shadow-secondary/5">
                <div className="w-16 h-16 bg-primary border border-secondary/10 overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-display font-black text-text-main uppercase truncate tracking-wide group-hover:text-secondary transition-colors">{item.name}</h3>
                  <p className="text-[11px] font-mono text-text-dim mt-1">${parseFloat(item.price.toString()).toFixed(2)}</p>
                </div>
                <div className="hidden sm:flex items-center px-2 py-1 border border-secondary/20 bg-secondary/5">
                  <span className="text-[9px] font-mono text-secondary uppercase tracking-widest">{item.category}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 cyber-panel py-12 flex flex-col items-center justify-center gap-3">
              <Zap className="w-6 h-6 text-text-dim/50" />
              <div className="text-[11px] font-mono text-text-dim tracking-widest uppercase">
                No recent scans found. Initialize exploration module.
              </div>
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
