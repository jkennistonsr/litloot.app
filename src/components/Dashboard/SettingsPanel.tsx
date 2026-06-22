import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, Settings, HelpCircle, Sun, Moon, Monitor, Globe, User, LogOut, Bell } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { cn } from '../../lib/utils';
import Tooltip from '../ui/Tooltip';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'profile' | 'interface';

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const addNotification = useNotificationStore(state => state.addNotification);

  const handleTestNotification = () => {
    const alerts = [
      { type: 'info', message: 'Session synchronized. Connection secure.' },
      { type: 'success', message: 'Marketplace updated. 10 new items available.' },
      { type: 'warning', message: 'Attempted brute-force detected. Firewalls initialized.' },
      { type: 'error', message: 'Core temperature rising. Cooling systems at 120%.' }
    ];
    const alert = alerts[Math.floor(Math.random() * alerts.length)];
    addNotification({ message: alert.message, type: alert.type as any });
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, desc: 'System Configuration' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'User Info & Preferences' },
    { id: 'interface', label: 'Interface', icon: Monitor, desc: 'Appearance' },
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] touch-none"
          />

          {/* Centered Panel */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-surface border border-text-main/20 rounded-md overflow-hidden shadow-2xl flex flex-col pointer-events-auto h-full max-h-[550px] sm:h-[500px]"
            >
              {/* Header with Tabs */}
              <div className="p-4 sm:p-6 border-b border-text-main/10 flex items-center justify-between bg-primary/20">
                <div className="flex gap-2 sm:gap-4">
                  {tabs.map((tab) => (
                    <Tooltip key={tab.id} content={tab.desc} position="bottom">
                      <button
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={cn(
                          "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm bg-primary/50 border transition-all group relative",
                          activeTab === tab.id 
                            ? "border-secondary/50 text-secondary bg-secondary/5 shadow-glow-cyan/10" 
                            : "border-text-main/10 text-text-dim hover:text-text-main hover:border-text-main/30"
                        )}
                      >
                        {activeTab === tab.id && (
                          <motion.div 
                            layoutId="settings-tab-indicator"
                            className="absolute -bottom-[20px] sm:-bottom-[25px] left-1/2 -translate-x-1/2 w-1 h-3 bg-secondary glow-cyan shadow-[0_0_10px_#00e5ff]"
                          />
                        )}
                        <tab.icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300", activeTab === tab.id ? "text-secondary scale-110" : "group-hover:text-text-main group-hover:scale-110")} />
                        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.1em] sm:tracking-[0.2em] font-black">{tab.label}</span>
                      </button>
                    </Tooltip>
                  ))}
                </div>
                
                <button 
                  onClick={onClose}
                  className="p-2 text-text-dim hover:text-secondary hover:bg-secondary/10 rounded-full transition-all duration-300 group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar relative">
                <div className="absolute inset-0 bg-secondary/[0.02] scanlines opacity-30 pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  {activeTab === 'general' && (
                    <motion.div
                      key="general"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="h-full flex flex-col items-center justify-center space-y-6 relative z-10"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Settings className="w-16 h-16 text-secondary/20 stroke-[1px] animate-[spin_10s_linear_infinite]" />
                          <Settings className="absolute inset-0 w-16 h-16 text-secondary/5 stroke-[1px] animate-[spin_15s_linear_infinite_reverse]" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.6em] text-secondary/50 font-black">CORE_SYSTEM_READY</span>
                      </div>

                      <button
                        onClick={handleTestNotification}
                        className="px-6 py-3 bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 text-secondary text-[10px] font-mono font-black uppercase tracking-[0.3em] cyber-corners transition-all flex items-center gap-2 group"
                      >
                        <Bell className="w-3.5 h-3.5 group-hover:glow-cyan-sm" />
                        TEST NOTIFICATION
                      </button>
                    </motion.div>
                  )}



                  {activeTab === 'profile' && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono text-secondary uppercase tracking-[0.3em] flex items-center gap-2">
                          <User className="w-3 h-3" /> Terminal Identity
                        </h3>
                        <p className="text-[10px] text-text-dim font-sans leading-relaxed">
                          Your secured identity matrix. Modify attributes for the marketplace logistics.
                        </p>
                        {user ? (
                          <form className="space-y-4 pt-4" onSubmit={(e) => {
                            e.preventDefault();
                            addNotification({ message: 'Profile updated applied.', type: 'success' });
                          }}>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-dim">Alias (Read Only)</label>
                              <input type="text" readOnly disabled value={user?.email || 'N/A'} className="w-full bg-primary/50 text-text-main p-2.5 rounded-sm border border-text-main/10 font-mono text-xs opacity-50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-secondary">Given Name</label>
                                <input type="text" defaultValue={user?.displayName?.split(' ')[0] || ''} className="w-full bg-primary text-text-main p-2.5 rounded-sm border border-secondary/20 focus:border-secondary transition-colors font-sans text-xs outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-secondary">Surname</label>
                                <input type="text" defaultValue={user?.displayName?.split(' ')[1] || ''} className="w-full bg-primary text-text-main p-2.5 rounded-sm border border-secondary/20 focus:border-secondary transition-colors font-sans text-xs outline-none" />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-secondary">Shipping Matrix (Address)</label>
                              <input type="text" placeholder="123 Alpha Base, Sector 7..." className="w-full bg-primary text-text-main p-2.5 rounded-sm border border-secondary/20 focus:border-secondary transition-colors font-sans text-xs outline-none" />
                            </div>
                            <button type="submit" className="w-full py-2.5 bg-secondary hover:bg-secondary/90 text-primary font-black font-mono uppercase tracking-[0.2em] rounded-xs mt-4">
                              Execute Update
                            </button>
                            <button 
                              type="button"
                              onClick={() => { logout(); onClose(); }}
                              className="w-full mt-2 py-2.5 border border-accent-pink/30 hover:bg-accent-pink/5 text-accent-pink text-[10px] uppercase font-mono font-black tracking-[0.2em] rounded-xs flex items-center justify-center gap-2"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Terminate Session
                            </button>
                          </form>
                        ) : (
                          <div className="text-[10px] text-text-dim italic">No identity loaded.</div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'interface' && (
                    <motion.div
                      key="interface"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <h3 className="text-xs font-mono text-secondary uppercase tracking-[0.3em] flex items-center gap-2">
                          <Globe className="w-3 h-3" /> Theme Protocol
                        </h3>
                        <p className="text-[10px] text-text-dim font-sans leading-relaxed">
                          Customize your interface appearance. Dark mode is recommended for optimal viewing.
                        </p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'system', label: 'System', icon: Monitor },
                            { id: 'light', label: 'Light', icon: Sun },
                            { id: 'dark', label: 'Dark', icon: Moon },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setTheme(t.id as any)}
                              className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-sm border transition-all group",
                                theme === t.id 
                                  ? "bg-secondary/10 border-secondary/50 text-secondary shadow-glow-cyan/5" 
                                  : "bg-primary/50 border-text-main/10 text-text-dim hover:text-text-main hover:border-text-main/30"
                              )}
                            >
                              <t.icon className={cn("w-5 h-5", theme === t.id ? "text-secondary glow-cyan" : "group-hover:text-text-main")} />
                              <span className="text-[9px] font-mono uppercase tracking-[0.2em]">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
