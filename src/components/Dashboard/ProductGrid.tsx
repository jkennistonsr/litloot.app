import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '../../types';
import { Plus, Minus, Search, Filter, ArrowUpDown, Eye, X, ShieldCheck, Zap, Info, Heart, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartAnimationStore } from '../../store/cartAnimationStore';
import { cn } from '../../lib/utils';
import Tooltip from '../ui/Tooltip';

interface ProductGridProps {
  products: Product[];
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
}

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'default';

function LazyImage({ src, alt, className, layoutId }: { src: string; alt: string; className?: string; layoutId?: string }) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    const el = document.getElementById(`img-container-${layoutId || alt}`);
    if (el) observer.observe(el);

    return () => observer.disconnect();
  }, [layoutId, alt]);

  return (
    <div id={`img-container-${layoutId || alt}`} className={cn("relative w-full h-full bg-primary/20 select-none", className)}>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-primary/20 backdrop-blur-sm"
          >
            <div className="w-4 h-4 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {isInView && (
        <motion.img
          layoutId={layoutId}
          src={src}
          alt={alt}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onLoad={() => setIsLoaded(true)}
          referrerPolicy="no-referrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "w-full h-full object-cover transition-transform duration-700",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}

export default function ProductGrid({ products, hasNextPage, onLoadMore, isFetchingMore }: ProductGridProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  
  const [categorySearch, setCategorySearch] = useState('');

  const addToCart = useCartStore(state => state.addToCart);
  const cartItems = useCartStore(state => state.cartItems);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const animateToCart = useCartAnimationStore(state => state.animateToCart);

  const wishlistItems = useWishlistStore(state => state.wishlistItems);
  const toggleWishlist = useWishlistStore(state => state.toggleWishlist);
  const isInWishlist = useWishlistStore(state => state.isInWishlist);

  const selectedProduct = useMemo(() => 
    products.find(p => p.id === selectedId) || null
  , [products, selectedId]);

  const handleClose = useCallback(() => setSelectedId(null), []);

  useEffect(() => {
    if (hasNextPage && onLoadMore && !isFetchingMore) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            onLoadMore();
          }
        },
        { rootMargin: '100px' }
      );

      const target = document.getElementById('infinite-scroll-trigger');
      if (target) observer.observe(target);
      return () => observer.disconnect();
    }
  }, [hasNextPage, onLoadMore, isFetchingMore]);

  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-product-modal-open', 'true');
    } else {
      document.body.removeAttribute('data-product-modal-open');
    }
  }, [selectedId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="space-y-6 pb-40">
      <div className={cn(
        "sticky top-0 z-20 bg-surface/95 backdrop-blur-md border p-3 sm:p-4 cyber-corners flex flex-col md:flex-row gap-3 sm:gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all",
        (searchTerm || selectedCategory !== 'all' || sortBy !== 'default') 
          ? "border-secondary/40 shadow-[0_0_20px_rgba(0,229,255,0.1)]" 
          : "border-secondary/20"
      )}>
        <div className="absolute top-0 left-10 w-20 h-[2px] bg-secondary glow-cyan opacity-50" />
        <div className="relative flex-1 group w-full">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-3 group-focus-within:h-5 bg-secondary shadow-[0_0_5px_#00f3ff] transition-all" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim group-focus-within:text-secondary group-focus-within:glow-cyan-sm transition-all" />
          <input 
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-primary border border-secondary/10 rounded-xs py-2 sm:py-2.5 pl-10 sm:pl-12 pr-4 text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-text-main placeholder:text-text-dim/50 dark:placeholder:text-text-dim/30 focus:outline-none focus:border-secondary/40 focus:bg-secondary/5 transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {/* Custom Category Dropdown */}
          <div className="relative flex-1 md:w-48 lg:w-56">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              className={cn(
                "w-full bg-primary/50 border border-secondary/10 rounded-xs py-2.5 px-4 text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-text-dim flex items-center justify-between hover:text-text-main hover:border-secondary/30 transition-all",
                selectedCategory !== 'all' && "text-secondary border-secondary/30"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{selectedCategory === 'all' ? 'All' : selectedCategory}</span>
              </div>
              <ChevronDown className={cn("w-3 h-3 transition-transform", isCategoryDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isCategoryDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsCategoryDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 z-40 bg-surface/95 backdrop-blur-xl border border-secondary/20 shadow-2xl rounded-xs overflow-hidden"
                  >
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                      <div className="px-2 py-2 border-b border-secondary/10 mb-1">
                        <input 
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-primary/30 border border-secondary/20 rounded-xs px-2 py-1.5 text-[8px] font-mono uppercase tracking-widest text-text-main focus:outline-none focus:border-secondary/50 transition-all"
                        />
                      </div>
                      {filteredCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                            setCategorySearch('');
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-[8px] font-mono uppercase tracking-widest transition-all rounded-xs flex items-center justify-between group",
                            selectedCategory === cat ? "bg-secondary text-primary" : "text-text-dim hover:bg-secondary/10 hover:text-main"
                          )}
                        >
                          {cat}
                          {selectedCategory === cat && (
                            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_5px_#fff]" />
                          )}
                        </button>
                      ))}
                      {filteredCategories.length === 0 && (
                        <div className="px-3 py-4 text-center text-[7px] font-mono text-text-dim/50 uppercase tracking-widest">
                          No matches scanned
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative group flex-1 md:w-32">
            <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 text-text-dim group-focus-within:text-secondary transition-all" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-primary/50 border border-secondary/10 rounded-xs py-2.5 pl-7 sm:pl-8 pr-7 sm:pr-8 text-[8px] sm:text-[9px] font-mono uppercase tracking-[0.2em] text-text-dim hover:text-text-main focus:outline-none focus:border-secondary/30 transition-all appearance-none cursor-pointer"
            >
              <option value="default">Relevance</option>
              <option value="price-asc">Price: Low-High</option>
              <option value="price-desc">Price: High-Low</option>
              <option value="name-asc">Name: A-Z</option>
            </select>
          </div>

          {(searchTerm || selectedCategory !== 'all' || sortBy !== 'default') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSortBy('default');
              }}
              className="px-3 py-2.5 bg-accent-pink/10 border border-accent-pink/20 text-accent-pink rounded-xs hover:bg-accent-pink hover:text-white transition-all group flex items-center gap-2"
              title="Reset Filters"
            >
              <X className="w-3 h-3" />
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest hidden lg:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {filteredAndSortedProducts.map((product, index) => (
          <motion.div
            layoutId={`card-${product.id}`}
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => setSelectedId(product.id)}
            whileHover={{ 
              y: -4,
              transition: { duration: 0.2, ease: 'easeOut' }
            }}
            className="group relative cursor-pointer force-gpu-layer"
            data-product-card
          >
            <div className="relative h-full bg-surface cyber-border cyber-corners p-5 flex flex-col gap-3 transition-all duration-300 group-hover:bg-secondary/[0.05] group-hover:border-secondary/40 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-sm will-change-transform">
              <div className="aspect-[4/3] bg-primary relative overflow-hidden group/img cyber-corners border border-secondary/10">
                <LazyImage 
                  layoutId={`image-${product.id}`}
                  src={product.image} 
                  alt={product.name}
                  className="group-hover/img:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="absolute top-2 left-2 px-2 py-1 bg-secondary/90 text-[8px] font-mono font-black text-primary uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,229,255,0.4)] z-10 transition-transform group-hover:translate-x-1">
                  AVAILABLE
                </div>
                
                <motion.button
                  layoutId={`wishlist-${product.id}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  className={cn(
                    "absolute top-2 right-2 p-2 rounded-xs border backdrop-blur-md transition-all duration-300 z-10 group/heart",
                    isInWishlist(product.id)
                      ? "bg-accent-pink/20 border-accent-pink/40 text-accent-pink shadow-[0_0_10px_rgba(255,0,255,0.3)]"
                      : "bg-primary/40 border-text-main/10 text-text-dim hover:text-accent-pink hover:border-accent-pink/30"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5 transition-all text-glow-pink", isInWishlist(product.id) && "fill-accent-pink")} />
                </motion.button>
              </div>

              <div className="space-y-3 flex-1 flex flex-col">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <motion.h3 
                      layoutId={`title-${product.id}`}
                      className="text-[13px] font-display font-black uppercase tracking-widest text-text-main leading-tight group-hover:text-secondary transition-colors"
                    >
                      {product.name}
                    </motion.h3>
                    <motion.span 
                      layoutId={`price-${product.id}`}
                      className="text-secondary font-mono font-black text-sm whitespace-nowrap ml-2 text-glow"
                    >
                      ${product.price}
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-secondary/20" />
                      <span className="text-[9px] font-mono text-text-dim uppercase tracking-[0.2em] truncate">{product.category}</span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedId(product.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-secondary/20 rounded-xs text-secondary border border-transparent hover:border-secondary/30 flex items-center gap-1"
                      title="Quick View"
                    >
                      <span className="text-[7px] font-mono hidden md:block">SCAN</span>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-text-dim line-clamp-2 uppercase tracking-tight font-mono leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity pl-2 border-l border-secondary/10">
                  {product.description || 'No manifest metadata available.'}
                </p>

                <div className="flex gap-2 mt-auto pt-2" onClick={e => e.stopPropagation()}>
                  {cartItems.find(item => item.id === product.id) ? (
                    <div className="w-full flex items-center justify-between bg-secondary/5 border border-secondary/40 rounded-xs h-10 group/qty">
                      <button onClick={(e) => {
                          e.stopPropagation();
                          const item = cartItems.find(i => i.id === product.id);
                          if (item && item.quantity === 1) {
                            removeFromCart(product.id);
                          } else {
                            updateQuantity(product.id, -1);
                          }
                        }}
                        className="px-4 h-full text-secondary/60 hover:text-secondary hover:bg-secondary/10 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="flex-1 flex items-center justify-center h-full border-x border-secondary/20">
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={cartItems.find(item => item.id === product.id)?.quantity}
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-[12px] font-mono font-black text-secondary text-glow leading-none"
                          >
                            {cartItems.find(item => item.id === product.id)?.quantity}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <button onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(product.id, 1);
                        }}
                        className="px-4 h-full text-secondary/60 hover:text-secondary hover:bg-secondary/10 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the image container for better animation starting point
                        const card = e.currentTarget.closest('[data-product-card]');
                        const imgContainer = card?.querySelector('[id^="img-container-"]');
                        const rect = imgContainer ? imgContainer.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                        animateToCart(product.image, rect);
                        addToCart(product);
                      }}
                      className="w-full bg-secondary text-primary py-2.5 cyber-corners font-black uppercase text-[10px] tracking-[0.3em] glow-cyan hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      ADD TO CART
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div id="infinite-scroll-trigger" className="h-24 flex items-center justify-center w-full">
        {isFetchingMore && (
          <div className="flex flex-col items-center gap-3">
             <Loader2 className="w-6 h-6 text-secondary animate-spin" />
             <span className="text-[10px] font-mono text-secondary uppercase tracking-[0.4em] animate-pulse">Syncing Manifest Data...</span>
          </div>
        )}
        {!hasNextPage && products.length > 0 && (
          <div className="w-full flex items-center justify-center gap-4 opacity-30 px-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-text-main/40" />
            <span className="text-[8px] font-mono text-text-dim uppercase tracking-[0.5em] whitespace-nowrap">End of Master Database</span>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-text-main/40" />
          </div>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {selectedId && selectedProduct ? (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[60] touch-none"
              />
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
                <motion.div
                  layoutId={`card-${selectedId}`}
                  className="w-full max-w-4xl bg-surface border border-text-main/20 rounded-md overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto max-h-[95vh] sm:max-h-[90vh]"
                >
                  <div className="relative w-full md:w-1/2 min-h-[250px] sm:min-h-[300px] md:h-auto bg-primary">
                    <motion.img
                      layoutId={`image-${selectedId}`}
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover select-none"
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <motion.button
                        layoutId={`wishlist-${selectedId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(selectedProduct);
                        }}
                        className={cn(
                          "p-3 rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl",
                          isInWishlist(selectedId)
                            ? "bg-accent-pink/30 border-accent-pink/50 text-accent-pink shadow-accent-pink/20"
                            : "bg-surface/50 border-white/10 text-white hover:text-accent-pink hover:border-accent-pink/30"
                        )}
                      >
                        <Heart className={cn("w-5 h-5", isInWishlist(selectedId) && "fill-accent-pink")} />
                      </motion.button>
                    </div>
                    <div className="absolute bottom-4 left-4 px-2 py-1 bg-primary/80 backdrop-blur-md rounded-xs border border-text-main/20 text-[8px] sm:text-[10px] font-mono text-secondary glow-cyan uppercase tracking-[0.2em]">
                      ID: {selectedId.split(/[\/_]/).pop()?.slice(-6) || '000000'}
                    </div>
                    
                    <button
                      onClick={handleClose}
                      className="absolute top-4 left-4 p-2 bg-primary/80 hover:bg-primary/90 text-text-main rounded-full transition-all md:hidden border border-text-main/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="w-full md:w-1/2 p-5 sm:p-8 flex flex-col bg-surface relative overflow-y-auto custom-scrollbar">
                    <button
                      onClick={handleClose}
                      className="absolute top-4 right-4 p-2 hover:bg-text-main/5 rounded-full text-text-dim hover:text-text-main transition-all z-10 hidden md:block"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/20 text-secondary text-[7px] sm:text-[8px] font-mono uppercase tracking-widest rounded-xs">
                            {selectedProduct.category}
                          </span>
                        </div>
                        <motion.h2 
                          layoutId={`title-${selectedId}`}
                          className="text-xl sm:text-2xl md:text-3xl font-black text-text-main uppercase tracking-tight leading-tight"
                        >
                          {selectedProduct.name}
                        </motion.h2>
                      </div>

                      <motion.div 
                        layoutId={`price-${selectedId}`}
                        className="flex items-baseline gap-2 pt-1"
                      >
                        <span className="text-2xl sm:text-3xl font-mono font-black text-secondary text-glow">
                          ${selectedProduct.price}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-text-dim uppercase tracking-widest">USD</span>
                      </motion.div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-text-dim">
                          <Info className="w-4 h-4 text-secondary" />
                          <span className="text-xs font-mono uppercase tracking-widest text-text-main/80">Description</span>
                        </div>
                        <p className="text-sm text-text-dim leading-relaxed font-sans first-letter:text-2xl first-letter:font-black first-letter:text-secondary first-letter:mr-1 first-letter:float-left">
                          {selectedProduct.description || 'Comprehensive metadata for this artifact is currently being decrypted. High-value item verified by LITLOOT protocols.'}
                        </p>
                      </div>

                      {/* Item Specifications */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-text-dim">
                          <Zap className="w-4 h-4 text-secondary animate-pulse" />
                          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-secondary/60">Technical Specifications</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { label: 'Artifact Class', value: selectedProduct.category },
                            { label: 'Sync Status', value: 'Nominal' },
                            { label: 'Encryption', value: 'AES-256 Quantum' },
                            { label: 'Verification', value: 'Level 5' },
                            { label: 'Network', value: 'Mainnet_Alpha' }
                          ].map((spec, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + i * 0.05 }}
                              className="flex items-center justify-between py-2 px-3 bg-secondary/5 border border-secondary/10 hover:border-secondary/30 transition-colors group"
                            >
                              <span className="text-[8px] font-mono text-text-dim uppercase tracking-wider group-hover:text-secondary group-hover:translate-x-1 transition-all">{spec.label}</span>
                              <span className="text-[9px] font-mono text-secondary font-black uppercase tracking-widest text-glow-sm">{spec.value}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-6 border-y border-text-main/10">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-secondary/60" />
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-mono text-text-dim uppercase">Security</p>
                            <p className="text-[10px] font-bold text-text-main uppercase">Verified</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-secondary/60" />
                          <div className="space-y-0.5">
                            <p className="text-[8px] font-mono text-text-dim uppercase">Origin</p>
                            <p className="text-[10px] font-bold text-text-main uppercase">Shopify_X</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {cartItems.find(item => item.id === selectedId) ? (
                          <div className="w-full flex items-center justify-between bg-primary/20 border border-secondary/30 rounded-sm h-14 shadow-glow-cyan/5">
                            <motion.button 
                              whileHover={{ backgroundColor: 'rgba(0, 243, 255, 0.05)' }}
                              whileTap={{ scale: 0.8, rotate: -90 }}
                              onClick={() => {
                                if (selectedProduct) {
                                  const item = cartItems.find(i => i.id === selectedId);
                                  if (item && item.quantity === 1) {
                                    removeFromCart(selectedId);
                                  } else {
                                    updateQuantity(selectedId, -1);
                                  }
                                }
                              }}
                              className="px-10 h-full text-secondary/60 hover:text-secondary transition-all"
                            >
                              <Minus className="w-5 h-5" />
                            </motion.button>
                            
                            <div className="flex-1 flex flex-col items-center justify-center h-full border-x border-secondary/20">
                              <AnimatePresence mode="wait">
                                <motion.span 
                                  key={cartItems.find(item => item.id === selectedId)?.quantity}
                                  initial={{ y: 10, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -10, opacity: 0 }}
                                  className="text-2xl font-mono font-black text-secondary text-glow leading-none"
                                >
                                  {cartItems.find(item => item.id === selectedId)?.quantity}
                                </motion.span>
                              </AnimatePresence>
                              <span className="text-[8px] font-mono text-secondary/40 uppercase tracking-[0.3em] mt-1 font-black">QUANTITY</span>
                            </div>

                            <motion.button 
                              whileHover={{ backgroundColor: 'rgba(0, 243, 255, 0.05)' }}
                              whileTap={{ scale: 1.4, rotate: 90 }}
                              onClick={() => updateQuantity(selectedId, 1)}
                              className="px-10 h-full text-secondary/60 hover:text-secondary transition-all"
                            >
                              <Plus className="w-5 h-5" />
                            </motion.button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              const img = e.currentTarget.closest('.md\\:flex-row')?.querySelector('img');
                              const rect = img ? img.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
                              animateToCart(selectedProduct.image, rect);
                              addToCart(selectedProduct);
                            }}
                            className="w-full bg-secondary text-primary py-4 rounded-sm font-black uppercase text-xs tracking-[0.2em] glow-cyan hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                          >
                            <Plus className="w-5 h-5" />
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          ) : null}
        </AnimatePresence>,
        document.body
      )}

      {filteredAndSortedProducts.length === 0 && (
        <div className="py-24 text-center border border-dashed border-secondary/20 rounded-md bg-secondary/5 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
          <div className="inline-block p-6 bg-secondary/10 rounded-full mb-6 relative">
            <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full" />
            <Search className="w-10 h-10 text-secondary relative z-10" />
          </div>
          <h3 className="text-xl text-text-main font-black uppercase tracking-[0.3em] mb-3">Void Detected</h3>
          <p className="text-text-dim text-xs uppercase font-mono tracking-widest max-w-[280px] mx-auto leading-loose mb-8">
            No items matches your current scan parameters. Adjust filters or search terms.
          </p>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSortBy('default');
            }}
            className="px-6 py-3 bg-secondary/10 border border-secondary/30 text-secondary font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-secondary hover:text-primary transition-all duration-300 rounded-xs"
          >
            Reset Master Scan
          </button>
        </div>
      )}
    </div>
  );
}
