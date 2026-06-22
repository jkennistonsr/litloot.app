import { useState, useEffect } from 'react';
import { Search, Bell, ShoppingCart, Heart, User } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { cn } from '../../lib/utils';
import { useCartStore } from '../../store/cartStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useWishlistStore } from '../../store/wishlistStore';
import Tooltip from '../ui/Tooltip';
import NotificationPanel from './NotificationPanel';
import ProfileMenu from './ProfileMenu';

interface HeaderProps {
  onSettingsClick?: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const cartCount = useCartStore(state => state.cartCount());
  const setIsCartOpen = useCartStore(state => state.setIsCartOpen);
  const wishlistItems = useWishlistStore(state => state.wishlistItems);
  const setIsWishlistOpen = useWishlistStore(state => state.setIsWishlistOpen);
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead);
  const unreadCount = useNotificationStore(state => state.unreadCount());
  const isNotifOpen = useNotificationStore(state => state.isNotifOpen);
  const setIsNotifOpen = useNotificationStore(state => state.setIsNotifOpen);
  const cargoControls = useAnimation();
  const heartControls = useAnimation();

  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      cargoControls.start({
        scale: [1, 1.4, 0.9, 1.1, 1],
        rotate: [0, -10, 10, -10, 0],
        filter: [
          'drop-shadow(0 0 0px #00f3ff)', 
          'drop-shadow(0 0 20px #00f3ff)', 
          'drop-shadow(0 0 0px #00f3ff)'
        ],
        transition: { duration: 0.6, ease: "easeOut" }
      });
    }
  }, [cartCount, cargoControls]);

  return (
    <header className={cn(
      "sticky top-0 z-30 transition-all duration-300 w-full",
      scrolled ? "bg-surface/95 backdrop-blur-xl border-b border-secondary/20 py-2 md:py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "py-3 md:py-6 bg-primary"
    )}>
      <div className="max-w-full mx-auto px-4 md:px-8 flex items-center justify-between relative">
        {/* Mobile menu removed as AdaptiveWrapper explicitly mounts a Bottom Nav for compact */}
        
        <div className="flex items-center relative flex-1 max-w-sm mr-auto group">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-[2px] h-3 bg-secondary/40 group-focus-within:bg-secondary group-focus-within:h-5 transition-all duration-300" />
          <Search className="absolute left-4 w-3.5 h-3.5 text-text-dim group-focus-within:text-secondary group-focus-within:scale-110 group-focus-within:glow-cyan-sm transition-all duration-300" />
          <input 
            type="text" 
            placeholder="Search products..."
            className="w-full bg-primary/50 border border-secondary/10 rounded-xs py-2.5 pl-10 pr-4 text-[10px] font-mono uppercase tracking-[0.2em] text-text-main placeholder:text-text-dim/40 dark:placeholder:text-text-dim/20 focus:outline-none focus:border-secondary/40 focus:bg-secondary/5 hover:bg-text-main/5 transition-all duration-300 force-gpu-layer"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <Tooltip content="Notifications" position="bottom">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 text-text-dim hover:text-secondary hover:bg-secondary/10 rounded-full transition-all duration-300 relative group force-gpu-layer"
            >
              <Bell className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_#00f3ff] transition-all" />
              <AnimatePresence mode="popLayout">
                {unreadCount > 0 && (
                  <motion.span 
                    key="notif-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent-pink text-text-main text-[8px] font-mono font-black rounded-full flex items-center justify-center px-1 border-2 border-primary shadow-[0_0_10px_rgba(255,42,109,0.5)] z-10"
                  >
                    <motion.span
                      key={unreadCount}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-block"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Tooltip>

          <Tooltip content="Wishlist" position="bottom">
            <motion.button 
              animate={heartControls}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsWishlistOpen(true)}
              className="p-2.5 text-text-dim hover:text-accent-pink hover:bg-accent-pink/10 rounded-full transition-all duration-300 relative group force-gpu-layer"
            >
              <Heart className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,0,255,0.5)] group-hover:fill-accent-pink/20 transition-all" />
              <AnimatePresence mode="popLayout">
                {wishlistCount > 0 && (
                  <motion.span 
                    key="wish-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent-pink text-text-main text-[8px] font-mono font-black rounded-full flex items-center justify-center px-1 border-2 border-primary shadow-[0_0_10px_rgba(255,42,109,0.5)] z-10"
                  >
                    <motion.span
                      key={wishlistCount}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-block"
                    >
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Tooltip>

          <Tooltip content="Cart" position="bottom">
            <motion.button 
              id="cart-trigger"
              animate={cargoControls}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 text-text-dim hover:text-secondary hover:bg-secondary/10 rounded-full transition-all duration-300 relative group force-gpu-layer"
            >
              <ShoppingCart className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_#00f3ff] transition-all" />
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && (
                  <motion.span 
                    key="cart-badge"
                    initial={{ scale: 0, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 45 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-secondary text-primary text-[8px] font-mono font-black rounded-full flex items-center justify-center px-1 border-2 border-primary shadow-[0_0_10px_rgba(0,243,255,0.5)] z-10"
                  >
                    <motion.span
                      key={cartCount}
                      initial={{ y: -5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="inline-block"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Tooltip>

          {onSettingsClick && (
            <div className="relative">
              <Tooltip content="Profile & Settings" position="bottom">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="p-2.5 text-text-dim hover:text-secondary hover:bg-secondary/10 rounded-full transition-all duration-300 relative group force-gpu-layer ml-1"
                >
                  <User className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_#00f3ff] transition-all" />
                </motion.button>
              </Tooltip>
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <ProfileMenu onClose={() => setIsProfileMenuOpen(false)} />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
        
        <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      </div>
    </header>
  );
}
