/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { useWishlistStore } from './store/wishlistStore';
import AuthScreen from './components/Auth/AuthScreen';
import Header from './components/Dashboard/Header';
import Sidebar from './components/Dashboard/Sidebar';
import ProductGrid from './components/Dashboard/ProductGrid';
import DashboardHome from './components/Dashboard/DashboardHome';
import CartSidebar from './components/Dashboard/CartSidebar';
import WishlistSidebar from './components/Dashboard/WishlistSidebar';
import { MOCK_PRODUCTS } from './lib/constants';
import { Product } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Loader2 } from 'lucide-react';
import { fetchShopifyProducts } from './lib/shopifyService';

import { useNotificationStore } from './store/notificationStore';
import { useThemeStore } from './store/themeStore';
import { CartAnimationOverlay } from './components/Dashboard/CartAnimationOverlay';
import SettingsPanel from './components/Dashboard/SettingsPanel';
import { AdaptiveWrapper } from './components/Layout/AdaptiveWrapper';
import { LayoutGrid, ShoppingCart, History, Zap, Settings } from 'lucide-react';
import { ScrollToTopFab } from './components/Shared/ScrollToTopFab';

import HistoryView from './components/Dashboard/HistoryView';

export type View = 'Dashboard' | 'Marketplace' | 'History' | 'Live Drops';

function AppContent() {
  const user = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isCartOpen = useCartStore(state => state.isCartOpen);
  const isWishlistOpen = useWishlistStore(state => state.isWishlistOpen);
  const isNotifOpen = useNotificationStore(state => state.isNotifOpen);
  const addNotification = useNotificationStore(state => state.addNotification);
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('Dashboard');

  const loadProducts = useCallback(async (cursor: string | null = null) => {
    if (fetchingProducts) return;
    setFetchingProducts(true);
    try {
      const result = await fetchShopifyProducts(cursor);
      setProducts(prev => cursor ? [...prev, ...result.products] : (result.products.length > 0 ? result.products : MOCK_PRODUCTS));
      setHasNextPage(result.pageInfo.hasNextPage);
      setEndCursor(result.pageInfo.endCursor);
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
      addNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'System link to Shopify marketplace failed.'
      });
      if (!cursor) setProducts(MOCK_PRODUCTS);
    } finally {
      setFetchingProducts(false);
    }
  }, [fetchingProducts, addNotification]);

  useEffect(() => {
    if (user && currentView === 'Marketplace' && products.length === 0) {
      loadProducts();
    }
  }, [user, currentView, products.length, loadProducts]);

  // Reset panels on auth change
  useEffect(() => {
    if (!user) {
      setIsSidebarOpen(false);
      setIsSettingsOpen(false);
      useCartStore.getState().setIsCartOpen(false);
      useWishlistStore.getState().setIsWishlistOpen(false);
      useNotificationStore.getState().setIsNotifOpen(false);
    }
  }, [user]);

  // Scroll lock when panels are active
  useEffect(() => {
    const isAnyPanelOpen = isSidebarOpen || isCartOpen || isWishlistOpen || isSettingsOpen || isNotifOpen;
    const isProductOpen = document.body.getAttribute('data-product-modal-open') === 'true';
    const shouldLock = isAnyPanelOpen || isProductOpen;

    if (shouldLock) {
      document.body.classList.add('scroll-lock');
    } else {
      document.body.classList.remove('scroll-lock');
    }
    
    // Observer to detect when ProductGrid adds/removes the attribute
    const observer = new MutationObserver(() => {
      const stillProductOpen = document.body.getAttribute('data-product-modal-open') === 'true';
      if (stillProductOpen || isSidebarOpen || isCartOpen || isWishlistOpen || isSettingsOpen || isNotifOpen) {
        document.body.classList.add('scroll-lock');
      } else {
        document.body.classList.remove('scroll-lock');
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ['data-product-modal-open'] });

    return () => {
      observer.disconnect();
      document.body.classList.remove('scroll-lock');
    };
  }, [isSidebarOpen, isCartOpen, isWishlistOpen, isSettingsOpen, isNotifOpen]);

  if (authLoading) return null;

  if (!user) {
    return <AuthScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <DashboardHome onGoToMarket={() => setCurrentView('Marketplace')} />;
      case 'Marketplace':
        return (
          <div className="space-y-8 md:space-y-12">
            {/* Immersive Hero Banner - Only in Marketplace */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-[200px] sm:h-[250px] md:h-[320px] cyber-corners bg-gradient-to-br from-surface to-[#1e2631] border border-secondary/20 overflow-hidden p-6 md:p-10 flex flex-col justify-center"
            >
              {/* Decorative hardware screw heads */}
              <div className="absolute top-4 left-4 w-1.5 h-1.5 bg-secondary/20 rounded-full" />
              <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-secondary/20 rounded-full" />
              <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-secondary/20 rounded-full" />
              <div className="absolute bottom-4 right-4 w-1.5 h-1.5 bg-secondary/20 rounded-full" />

              <div className="absolute -top-12 -right-12 w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[300px] md:h-[300px] bg-accent-pink rounded-full blur-[60px] sm:blur-[80px] md:blur-[120px] opacity-20 pointer-events-none" />
              
              <div className="relative z-10 space-y-2 md:space-y-4 pr-10">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-black leading-[0.85] tracking-tighter uppercase text-text-main drop-shadow-[0_0_10px_rgba(var(--color-text-main-rgb),0.1)]">
                  NEON KITSUNE<br />COLLECTION
                </h1>
                <p className="text-text-dim max-w-sm text-[10px] sm:text-xs md:text-sm leading-relaxed font-mono opacity-100 dark:opacity-80 line-clamp-2 sm:line-clamp-none">
                  Advanced techwear aesthetic. Limited quantity available.
                </p>
              </div>
            </motion.div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight text-text-main flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-secondary" />
                  PRODUCTS
                </div>
                {fetchingProducts && (
                  <div className="flex items-center gap-2 text-[10px] text-text-dim font-mono animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Loading products...
                  </div>
                )}
              </h2>
              <ProductGrid 
                products={products} 
                hasNextPage={hasNextPage}
                onLoadMore={() => loadProducts(endCursor)}
                isFetchingMore={fetchingProducts && products.length > 0}
              />
            </div>
          </div>
        );
      case 'History':
        return <HistoryView />;
      default:
        return (
          <div className="h-[60vh] flex items-center justify-center text-text-dim gap-3 opacity-50">
            <Terminal className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-[0.3em]">Loading View...</span>
          </div>
        );
    }
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutGrid, label: 'Overview' },
    { id: 'Marketplace', icon: ShoppingCart, label: 'Marketplace' },
    { id: 'History', icon: History, label: 'History' },
    { id: 'Live Drops', icon: Zap, label: 'Live Drops' }
  ];

  return (
    <AdaptiveWrapper
      className="grid-bg selection:bg-secondary/30 selection:text-secondary select-none"
      navItems={navItems}
      activeId={currentView}
      onNavigate={(id) => {
        if (id === 'Settings') setIsSettingsOpen((prev) => !prev);
        else setCurrentView(id as View);
      }}
      brandName="LITLOOT"
    >
      <Header onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen)} />
      <div className="px-4 md:px-8 pb-8 flex-1 w-full pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30,
              filter: { duration: 0.1 }
            }}
            style={{ willChange: 'transform, opacity, filter' }}
            className="force-gpu-layer"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      <CartSidebar />
      <WishlistSidebar />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {(currentView === 'Marketplace' || currentView === 'History') && <ScrollToTopFab />}
    </AdaptiveWrapper>
  );
}

export default function App() {
// Prevent global zoom behaviors (pinch and ctrl+scroll)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '-' || e.key === '0' || e.key === '+')) {
        e.preventDefault();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGestureStart = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('gesturestart', handleGestureStart);

    const unsubTheme = useThemeStore.getState().initThemeListener();
    const unsubCart = useCartStore.getState().initCartListener();
    const unsubNotif = useNotificationStore.getState().initNotificationListener();
    const unsubWishlist = useWishlistStore.getState().initWishlistListener();

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('gesturestart', handleGestureStart);
      unsubTheme();
      unsubCart();
      unsubNotif();
      unsubWishlist();
    };
  }, []);

  return (
    <>
      <AppContent />
      <CartAnimationOverlay />
    </>
  );
}
