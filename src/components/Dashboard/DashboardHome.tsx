import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuthStore } from '../../store/authStore';
import { useRecentlyViewedStore } from '../../store/recentlyViewedStore';
import { Shield, Zap, ShoppingBag } from 'lucide-react';
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
    <div className="space-y-8 md:space-y-12">
      {/* Hero Welcome */}
      <section className="relative py-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-text-main leading-none pr-8 force-gpu-layer">
            WELCOME BACK,<br />
            <span className="text-secondary text-glow break-words animate-pulse-slow">{username}</span>
          </h1>
          <p className="text-text-dim max-w-lg text-[10px] sm:text-xs md:text-sm leading-relaxed font-mono tracking-wide opacity-100 dark:opacity-80 pr-12 line-clamp-2 md:line-clamp-none">
            Session active. Your quantum connection is secure. Browse the latest arrivals in the marketplace or review your acquired artifacts.
          </p>
        </motion.div>
      </section>

      {/* Grid Stats / Status */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {[
          { icon: Shield, label: 'Auth Status', value: 'Verified', color: 'text-secondary', tooltip: 'Security protocols active' },
          { icon: Zap, label: 'Sync Rate', value: '100%', color: 'text-accent-pink', tooltip: 'Connection stability' },
          { icon: ShoppingBag, label: 'Recent Views', value: recentLoading ? '...' : recentItems.length.toString(), color: 'text-text-main', tooltip: 'Artifacts recently scanned' },
        ].map((stat, idx) => (
          <Tooltip key={idx} content={stat.tooltip} position="top" className={cn("w-full", idx === 2 && "col-span-2 md:col-span-1")}>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
              className="bg-surface/50 backdrop-blur-sm border border-secondary/20 p-4 md:p-6 cyber-corners relative group h-full cursor-help transition-all duration-300 hover:bg-secondary/10 hover:border-secondary/40 force-gpu-layer shadow-[0_5px_15px_rgba(0,0,0,0.2)]"
            >
              <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-secondary/20 rounded-full group-hover:bg-secondary group-hover:animate-pulse transition-all" />
              
              <div className="flex items-center gap-2 md:gap-3 relative z-10 mb-2 md:mb-4">
                <div className="p-1.5 md:p-2 bg-secondary/5 rounded-xs group-hover:bg-secondary/10 transition-colors border border-secondary/10 group-hover:border-secondary/30">
                  <stat.icon className={stat.color + " w-4 h-4 md:w-5 md:h-5 drop-shadow-[0_0_5px_currentColor]"} />
                </div>
                <span className="text-[8px] md:text-[10px] font-mono text-text-dim uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
              <div className="text-xl md:text-3xl font-display font-black text-text-main italic tracking-tight relative z-10 truncate">{stat.value}</div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-secondary shadow-[0_0_5px_#00e5ff]" />
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-text-main">Recently Viewed</h2>
          </div>
          <button 
            onClick={onGoToMarket}
            className="text-[10px] font-mono text-secondary hover:text-white transition-colors flex items-center gap-2 group"
          >
            VIEW ALL <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentLoading ? (
            // Loading Skeletons
            [1, 2].map((i) => (
              <div key={i} className="bg-surface/30 p-4 border border-secondary/5 cyber-corners flex gap-4 items-center group hover:bg-secondary/5 hover:border-secondary/20 transition-all duration-300">
                <div className="w-16 h-16 bg-primary cyber-corners border border-secondary/10 overflow-hidden flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-secondary/10 to-transparent group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 bg-text-main/5 group-hover:bg-secondary/20 transition-colors animate-pulse" />
                  <div className="h-2 w-20 bg-text-main/5 group-hover:bg-secondary/10 transition-colors animate-pulse" />
                </div>
                <div className="text-xs font-mono text-secondary italic opacity-0 group-hover:opacity-100 transition-opacity">ENCRYPTED</div>
              </div>
            ))
          ) : recentItems.length > 0 ? (
            recentItems.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-surface/30 p-3 border border-secondary/10 hover:border-secondary/40 cyber-corners flex gap-4 items-center group transition-all duration-300 shadow-sm hover:shadow-glow-cyan/10">
                <div className="w-16 h-16 bg-primary cyber-corners border border-secondary/10 overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-text-main uppercase truncate tracking-tight">{item.name}</h3>
                  <p className="text-[10px] font-mono text-secondary italic mt-1 font-bold">${item.price}</p>
                </div>
                <div className="text-[9px] font-mono text-text-dim bg-secondary/10 px-2 py-1 uppercase border border-secondary/10 hidden sm:block">
                  {item.category}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-[10px] font-mono text-text-dim text-center py-10 opacity-60 border border-dashed border-text-main/10 cyber-corners">
              No recent scans found. Initialize exploration module.
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
}
