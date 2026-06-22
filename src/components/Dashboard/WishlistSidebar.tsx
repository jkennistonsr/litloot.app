import { useState, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { createPortal } from 'react-dom';
import { Heart, Terminal, X, Trash2, ShoppingCart, Plus, Minus, CheckSquare, Square, Pin, PinOff, ArrowUpDown, ChevronDown, Trash, MousePointer2 } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import Tooltip from '../ui/Tooltip';

export default function WishlistSidebar() {
  const wishlistItems = useWishlistStore(state => state.wishlistItems);
  const isWishlistOpen = useWishlistStore(state => state.isWishlistOpen);
  const setIsWishlistOpen = useWishlistStore(state => state.setIsWishlistOpen);
  const updateQuantity = useWishlistStore(state => state.updateQuantity);
  const togglePin = useWishlistStore(state => state.togglePin);
  const toggleSelection = useWishlistStore(state => state.toggleSelection);
  const selectAll = useWishlistStore(state => state.selectAll);
  const removeItems = useWishlistStore(state => state.removeItems);
  const addSelectedToCart = useWishlistStore(state => state.addSelectedToCart);
  const addAllToCart = useWishlistStore(state => state.addAllToCart);
  const reorderItems = useWishlistStore(state => state.reorderItems);

  const [sortBy, setSortBy] = useState<'price' | 'name' | 'category' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const selectedCount = wishlistItems.filter(i => i.selected).length;

  const sortedItems = useMemo(() => {
    return [...wishlistItems].sort((a, b) => {
      // Pinning always takes priority
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then apply user sorting
      let comparison = 0;
      if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'category') comparison = a.category.localeCompare(b.category);
      else comparison = (a.addedAt?.toMillis?.() || 0) - (b.addedAt?.toMillis?.() || 0);

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [wishlistItems, sortBy, sortOrder]);

  const totalSelectedPrice = wishlistItems
    .filter(i => i.selected)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsWishlistOpen(false)}
            className="fixed inset-0 bg-primary/90 backdrop-blur-sm z-[60] touch-none"
          />
          
          <motion.section 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface/98 backdrop-blur-xl border-l border-accent-pink/20 flex flex-col z-[70] shadow-[-20px_0_50px_rgba(255,0,255,0.1)] overflow-hidden"
          >
            <div className="p-4 md:p-6 border-b border-accent-pink/10 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 h-full w-[2px] bg-accent-pink glow-pink opacity-20" />
              
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-accent-pink fill-accent-pink/20" />
                <h2 className="text-lg md:text-xl font-display font-black uppercase tracking-widest text-text-main leading-none">Wishlist</h2>
                {wishlistItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-accent-pink/20 text-accent-pink border border-accent-pink/30 text-[9px] font-mono font-black rounded-xs">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setIsWishlistOpen(false)}
                className="p-2 hover:bg-accent-pink/10 rounded-xs text-text-dim hover:text-accent-pink transition-all group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Sub-Header: Controls */}
            {wishlistItems.length > 0 && (
              <div className="px-4 md:px-6 py-3 bg-accent-pink/5 border-b border-accent-pink/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => selectAll(selectedCount !== wishlistItems.length)}
                    className="flex items-center gap-2 group cursor-pointer"
                   >
                    {selectedCount === wishlistItems.length ? (
                      <CheckSquare className="w-4 h-4 text-accent-pink" />
                    ) : (
                      <Square className="w-4 h-4 text-text-dim group-hover:text-accent-pink transition-colors" />
                    )}
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim group-hover:text-accent-pink transition-colors">ALL</span>
                   </button>

                   {selectedCount > 0 && (
                     <button 
                      onClick={() => removeItems(wishlistItems.filter(i => i.selected).map(i => i.id))}
                      className="text-[10px] font-mono uppercase tracking-widest text-accent-pink border-l border-accent-pink/20 pl-4 hover:brightness-125 transition-all flex items-center gap-2"
                     >
                       <Trash className="w-3.5 h-3.5" />
                       REMOVE ({selectedCount})
                     </button>
                   )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-2 py-1 bg-surface/50 border border-accent-pink/20 rounded-xs text-[9px] font-mono uppercase tracking-widest text-text-dim hover:text-accent-pink transition-all">
                      <ArrowUpDown className="w-3 h-3" />
                      {sortBy}
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-accent-pink/20 rounded-xs shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-20 overflow-hidden">
                      {['date', 'price', 'name', 'category'].map(option => (
                        <button 
                          key={option}
                          onClick={() => setSortBy(option as any)}
                          className={cn(
                            "w-full text-left px-3 py-2 text-[9px] font-mono uppercase tracking-widest hover:bg-accent-pink/10 transition-colors",
                            sortBy === option ? "text-accent-pink bg-accent-pink/5" : "text-text-dim"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col custom-scrollbar">
              {wishlistItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 gap-6">
                  <Heart className="w-24 h-24 text-accent-pink/20 stroke-[0.5px] drop-shadow-[0_0_15px_rgba(255,0,255,0.2)]" />
                  <div className="space-y-3">
                    <h3 className="text-xl font-display font-black uppercase tracking-[0.4em] text-text-main italic glow-pink-sm">Heartless System</h3>
                    <p className="text-[10px] font-mono text-text-dim uppercase tracking-[0.2em] leading-relaxed opacity-70">
                      Wishlist manifest represents a void. Designate primary artifacts for future acquisition.
                    </p>
                  </div>
                </div>
              ) : (
                <Reorder.Group axis="y" values={sortedItems} onReorder={reorderItems} className="space-y-4">
                  {sortedItems.map((item) => (
                    <Reorder.Item 
                      key={item.id} 
                      value={item}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group/item relative"
                    >
                      <div className={cn(
                        "flex gap-4 p-3 bg-surface/50 border rounded-xs transition-all duration-300",
                        item.selected ? "border-accent-pink/40 bg-accent-pink/5" : "border-accent-pink/10",
                        item.isPinned ? "shadow-[0_0_15px_rgba(255,0,255,0.1)] border-accent-pink/30" : ""
                      )}>
                        {/* Control Area */}
                        <div className="flex flex-col items-center justify-between gap-2 border-r border-accent-pink/10 pr-3">
                          <button 
                            onClick={() => toggleSelection(item.id)}
                            className="p-1 hover:brightness-125 transition-all"
                          >
                            {item.selected ? (
                              <CheckSquare className="w-4 h-4 text-accent-pink shadow-[0_0_5px_rgba(255,0,255,0.4)]" />
                            ) : (
                              <Square className="w-4 h-4 text-text-dim" />
                            )}
                          </button>
                          
                          <button 
                            onClick={() => togglePin(item.id)}
                            className={cn(
                              "p-1 transition-all hover:scale-110",
                              item.isPinned ? "text-accent-pink shadow-pink" : "text-text-dim"
                            )}
                          >
                            <Pin className={cn("w-3.5 h-3.5", item.isPinned && "fill-accent-pink")} />
                          </button>
                          
                          <div className="cursor-grab active:cursor-grabbing text-text-dim/30 hover:text-accent-pink/50 transition-colors">
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Image */}
                        <div className="w-20 h-20 bg-primary/50 cyber-corners border border-accent-pink/10 overflow-hidden flex-shrink-0 relative">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover opacity-60 group-hover/item:opacity-100 group-hover/item:scale-105 transition-all duration-700" 
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="text-[12px] font-display font-black uppercase text-text-main tracking-widest leading-tight truncate group-hover/item:text-accent-pink transition-colors">
                                {item.name}
                              </h3>
                              <span className="text-[11px] font-mono text-accent-pink font-black tracking-tighter whitespace-nowrap">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[8px] font-mono text-text-dim uppercase tracking-[0.2em] truncate">{item.category}</p>
                              <p className="text-[9px] font-mono text-text-dim/60 font-bold">${item.price.toFixed(2)} / UNIT</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center bg-primary/40 border border-accent-pink/20 rounded-xs overflow-hidden h-7">
                              <button onClick={() => item.quantity === 1 ? removeItems([item.id]) : updateQuantity(item.id, -1)}
                                className="px-2.5 h-full text-text-dim hover:text-accent-pink hover:bg-accent-pink/10 transition-colors"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="w-8 text-center text-[10px] font-mono font-black text-accent-pink border-x border-accent-pink/10 leading-none h-full flex items-center justify-center">
                                {item.quantity}
                              </span>
                              <button onClick={() => updateQuantity(item.id, 1)} 
                                className="px-2.5 h-full text-text-dim hover:text-accent-pink hover:bg-accent-pink/10 transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <Tooltip content="MOVE TO CART">
                                <button 
                                  onClick={() => {
                                    addSelectedToCart(); // Currently uses logic for selected, maybe refine to this item
                                    // For single item, we'll use a specific logic if needed, but the button above says "addSelected" or "addAll"
                                    // Let's make this individual button work too
                                    useWishlistStore.getState().toggleSelection(item.id);
                                    addSelectedToCart();
                                  }}
                                  className="p-1.5 bg-accent-pink/10 border border-accent-pink/20 rounded-xs text-accent-pink hover:bg-accent-pink hover:text-primary transition-all active:scale-95"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                              
                              <button 
                                onClick={() => removeItems([item.id])}
                                className="p-1.5 text-text-dim hover:text-accent-pink hover:bg-accent-pink/10 rounded-xs transition-all opacity-40 hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>

            {wishlistItems.length > 0 && (
              <div className="p-4 md:p-8 border-t border-accent-pink/10 space-y-4 bg-primary/20 backdrop-blur-md">
                <div className="relative group">
                  <div className="bg-accent-pink/5 border border-accent-pink/20 cyber-corners p-5 relative overflow-hidden transition-all duration-300 hover:bg-accent-pink/10 hover:border-accent-pink/40">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-accent-pink glow-pink" />
                    <div className="space-y-1 relative z-10">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-mono text-accent-pink uppercase tracking-[0.4em] font-black flex items-center gap-2">
                          <Terminal className="w-3 h-3" />
                          manifest total
                        </p>
                        <span className="text-[7px] font-mono text-text-dim uppercase tracking-[0.2em] italic">CRYPTO-VALUATION</span>
                      </div>
                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-4xl font-display font-black tracking-tighter text-text-main text-glow-pink">
                          ${wishlistItems.reduce((acc, cur) => acc + cur.price * cur.quantity, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={addSelectedToCart}
                    disabled={selectedCount === 0}
                    className={cn(
                      "flex-1 py-4 cyber-corners font-display font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-2",
                      selectedCount > 0 
                        ? "bg-accent-pink/20 border border-accent-pink/40 text-accent-pink glow-pink-sm hover:brightness-110 active:scale-95" 
                        : "bg-surface/50 border border-text-main/10 text-text-dim cursor-not-allowed opacity-50"
                    )}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    ACQUIRE SELECTED
                  </button>
                  <button 
                    onClick={addAllToCart}
                    className="cyber-button-accent py-4 flex-1 flex items-center justify-center gap-2 text-[10px]"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    ACQUIRE ALL
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
