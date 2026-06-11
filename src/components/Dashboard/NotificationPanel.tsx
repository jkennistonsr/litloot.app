import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Bell, X, Info, CheckCircle, AlertTriangle, ShieldAlert, Terminal } from 'lucide-react';
import { useNotificationStore, Notification } from '../../store/notificationStore';
import { cn } from '../../lib/utils';
import Tooltip from '../ui/Tooltip';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const notifications = useNotificationStore(state => state.notifications);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const unreadCount = useNotificationStore(state => state.unreadCount());

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop to close when clicking outside */}
          <div 
            className="fixed inset-0 z-[60] touch-none" 
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-4 md:right-8 w-full max-w-[340px] bg-surface/95 backdrop-blur-xl border border-text-main/20 rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[70] overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-text-main/20 bg-text-main/5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-secondary" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-main">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-accent-pink/20 text-accent-pink border border-accent-pink/30 text-[9px] font-mono font-black rounded-xs">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <Tooltip content="Close Panel" position="left">
                <button 
                  onClick={onClose}
                  className="text-text-dim hover:text-text-main transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                  <div className="relative">
                    <ShieldAlert className="w-12 h-12 text-text-main/10" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} 
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="absolute inset-0 bg-secondary rounded-full blur-[20px] -z-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-main text-xs font-bold uppercase tracking-wider">No Notifications</p>
                    <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest max-w-[200px] mx-auto">
                      You currently have no new notifications.
                    </p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="mt-2 px-6 py-2 bg-text-main/5 hover:bg-secondary/10 border border-text-main/20 hover:border-secondary/30 text-secondary text-[9px] font-black font-mono uppercase tracking-[0.2em] rounded-xs transition-all"
                  >
                    Okay
                  </button>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                    className={cn(
                      "p-3 rounded-sm border transition-all cursor-pointer relative group overflow-hidden",
                      notif.read 
                        ? "bg-text-main/5 border-transparent hover:bg-text-main/10" 
                        : "bg-secondary/5 border-secondary/20 hover:border-secondary/40"
                    )}
                  >
                    {!notif.read && (
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-secondary glow-cyan" />
                    )}
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {notif.type === 'info' && <Info className="w-4 h-4 text-secondary object-contain" />}
                        {notif.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                        {notif.type === 'error' && <X className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-xs leading-relaxed",
                          notif.read ? "text-text-dim" : "text-text-main font-medium"
                        )}>
                          {notif.message}
                        </p>
                        <p className="text-[9px] font-mono text-text-dim/60 uppercase tracking-widest flex items-center justify-between">
                          <span>{new Date(notif.timestamp).toLocaleTimeString()}</span>
                          {!notif.read && <span className="text-secondary">UNREAD</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-text-main/20 bg-primary/50 flex justify-center">
                <p className="text-[9px] font-mono text-text-dim uppercase tracking-[0.3em] flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  END OF LIST
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
