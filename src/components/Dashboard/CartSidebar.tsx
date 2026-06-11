import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { ShoppingBag, Terminal, X, Trash2, ShoppingCart, Plus, Minus, CheckSquare, Square, ShieldAlert } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import Tooltip from '../ui/Tooltip';

export default function CartSidebar() {
  const cartItems = useCartStore(state => state.cartItems);
  const isCartOpen = useCartStore(state => state.isCartOpen);
  const setIsCartOpen = useCartStore(state => state.setIsCartOpen);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const purgeItems = useCartStore(state => state.purgeItems);
  const cartTotal = useCartStore(state => state.cartTotal());
  const selectedIds = useCartStore(state => state.selectedIds);
  const toggleSelection = useCartStore(state => state.toggleSelection);
  const setAllSelected = useCartStore(state => state.setAllSelected);

  const handlePurge = () => {
    if (selectedIds.length === 0) return;
    purgeItems(selectedIds);
  };

  const toggleSelectAll = () => {
    setAllSelected(selectedIds.length !== cartItems.length);
  };

  const selectedCount = selectedIds.length;
  const effectiveCheckoutCount = selectedCount > 0 ? selectedCount : cartItems.length;
  const checkoutLabel = `CHECKOUT (${effectiveCheckoutCount})`;

  const selectedTotal = cartItems
    .filter(item => selectedIds.length > 0 ? selectedIds.includes(item.id) : true)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-primary/90 backdrop-blur-sm z-[60] touch-none"
          />
          
          {/* Sidebar */}
          <motion.section 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface/98 backdrop-blur-xl border-l border-secondary/20 flex flex-col z-[70] shadow-[-20px_0_50px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="p-4 md:p-6 border-b border-secondary/10 flex items-center justify-between relative overflow-hidden">
               {/* Hardware glow bar side */}
              <div className="absolute top-0 right-0 h-full w-[2px] bg-secondary glow-cyan opacity-20" />
              
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-secondary" />
                <h2 className="text-lg md:text-xl font-display font-black uppercase tracking-widest text-text-main leading-none">Cart</h2>
                {cartItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 text-[9px] font-mono font-black rounded-xs">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-secondary/10 rounded-xs text-text-dim hover:text-secondary transition-all group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
                  <div className="relative">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-0 bg-secondary/20 rounded-full blur-[50px]" 
                    />
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="relative z-10"
                    >
                      <ShoppingCart className="w-24 h-24 text-secondary/20 stroke-[0.5px] drop-shadow-[0_0_15px_rgba(0,229,255,0.2)]" />
                    </motion.div>
                  </div>
                  <div className="space-y-3 max-w-[240px]">
                    <h3 className="text-xl font-display font-black uppercase tracking-[0.4em] text-text-main italic glow-cyan-sm">System Empty</h3>
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-[0.2em] leading-relaxed opacity-70">
                      Inventory depleted. Explore the marketplace to acquire new hardware.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-6 px-10 py-4 bg-secondary text-primary border border-secondary font-display font-black uppercase text-xs tracking-[0.3em] cyber-corners transition-all flex items-center gap-3 group glow-cyan hover:brightness-110 active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4 transition-transform group-hover:scale-110" />
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.id} 
                    className="flex gap-4 group/item"
                  >
                    <div 
                      onClick={() => toggleSelection(item.id)}
                      className="flex items-center cursor-pointer py-2"
                    >
                      {selectedIds.includes(item.id) ? (
                        <div className="w-4 h-4 bg-secondary shadow-[0_0_8px_#00f3ff] rounded-xs flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary stroke-[3px]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 border border-secondary/30 group-hover/item:border-secondary transition-colors rounded-xs" />
                      )}
                    </div>

                    <div className="w-20 h-20 bg-primary/50 cyber-corners border border-secondary/10 overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        referrerPolicy="no-referrer" 
                        className="w-full h-full object-cover opacity-60 group-hover/item:opacity-100 group-hover/item:scale-105 transition-all duration-700" 
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 text-left">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-[12px] font-display font-black uppercase text-text-main tracking-widest leading-tight line-clamp-1 truncate pr-2 group-hover/item:text-secondary transition-colors">{item.name}</h3>
                          <span className="text-[11px] font-mono text-secondary text-glow font-black tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-2 h-[1px] bg-secondary/30" />
                          <p className="text-[8px] font-mono text-text-dim uppercase tracking-[0.2em]">{item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-primary/40 border border-secondary/20 rounded-xs overflow-hidden h-7">
                          <button onClick={() => item.quantity === 1 ? removeFromCart(item.id) : updateQuantity(item.id, -1)}
                            className="px-2.5 h-full text-text-dim hover:text-secondary hover:bg-secondary/10 transition-colors"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          
                          <span className="w-8 text-center text-[10px] font-mono font-black text-secondary border-x border-secondary/10 leading-none h-full flex items-center justify-center">{item.quantity}</span>
                          
                          <button onClick={() => updateQuantity(item.id, 1)} 
                            className="px-2.5 h-full text-text-dim hover:text-secondary hover:bg-secondary/10 transition-colors"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1.5 text-text-dim hover:text-accent-pink hover:bg-accent-pink/10 rounded-xs transition-all opacity-40 hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 md:p-8 border-t border-secondary/10 space-y-4 md:space-y-6 bg-primary/20 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2">
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-3 group/select-all cursor-pointer"
                  >
                    {selectedIds.length === cartItems.length ? (
                      <div className="w-4 h-4 bg-secondary shadow-[0_0_8px_#00f3ff] rounded-xs flex items-center justify-center">
                        <CheckSquare className="w-3 h-3 text-primary stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 border border-secondary/30 group-hover/select-all:border-secondary transition-colors rounded-xs" />
                    )}
                    <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-text-dim group-hover/select-all:text-secondary transition-colors">all</span>
                  </button>
                  {selectedIds.length > 0 && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={handlePurge}
                      className="text-[8px] font-mono font-black uppercase tracking-[0.2em] text-accent-pink hover:text-glow-pink transition-colors flex items-center gap-2 border border-accent-pink/20 px-2 py-1 bg-accent-pink/5 cyber-corners"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      REMOVE ({selectedIds.length})
                    </motion.button>
                  )}
                </div>

                <div className="relative group">
                  {/* Tactical Data Box */}
                  <div className="bg-secondary/5 border border-secondary/20 cyber-corners p-5 relative overflow-hidden transition-all duration-300 group-hover:bg-secondary/10 group-hover:border-secondary/40">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-secondary shadow-[0_0_10px_#00f3ff]" />
                    <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full blur-[30px] -z-10" />
                    
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-mono text-secondary uppercase tracking-[0.4em] font-black flex items-center gap-2">
                          <Terminal className="w-3 h-3" />
                          total
                        </p>
                        <span className="text-[7px] font-mono text-text-dim uppercase tracking-[0.2em]">LIVE TOTAL</span>
                      </div>
                      
                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-4xl font-display font-black tracking-tighter text-text-main text-glow">
                          ${selectedTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full bg-secondary text-primary py-4 cyber-corners font-display font-black uppercase text-xs tracking-[0.4em] glow-cyan hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                  <ShoppingCart className="w-4 h-4 shadow-primary/20" />
                  {checkoutLabel}
                </button>
              </div>
            )}
          </motion.section>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
