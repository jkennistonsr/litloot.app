import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Zap, Server } from 'lucide-react';
import { Product } from '../../types';

interface CompareModalProps {
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareModal({ products, onClose, onRemove }: CompareModalProps) {
  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-primary/95 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl max-h-[85vh] bg-surface cyber-border cyber-corners shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-text-main/10 bg-primary/50 relative">
            <div className="absolute inset-0 bg-secondary/[0.02] scanlines pointer-events-none" />
            <h2 className="text-sm font-display font-black text-text-main uppercase tracking-widest relative z-10 flex items-center gap-2">
              <Server className="w-4 h-4 text-secondary" />
              Hardware Comparison Matrix
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-text-dim hover:text-secondary hover:bg-secondary/10 rounded-xs transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-6 relative">
             {products.length === 0 ? (
               <div className="flex items-center justify-center h-full text-text-dim font-mono text-xs uppercase tracking-widest">
                 No items selected for comparison
               </div>
             ) : (
               <div className="flex gap-6 min-w-max">
                 {products.map((product) => (
                   <div key={product.id} className="w-72 flex flex-col gap-4">
                     <div className="relative group">
                       <button
                         onClick={() => onRemove(product.id)}
                         className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xs transition-colors z-10 opacity-0 group-hover:opacity-100"
                         title="Remove from comparison"
                       >
                         <X className="w-3 h-3" />
                       </button>
                       <div className="aspect-[4/3] bg-primary rounded-xs overflow-hidden border border-text-main/10">
                         <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                       </div>
                       <div className="mt-3">
                         <h3 className="text-xs font-display font-black text-text-main uppercase tracking-wider leading-tight h-8 line-clamp-2">
                           {product.name}
                         </h3>
                         <p className="text-secondary font-mono font-black mt-2 text-sm text-glow-sm">
                           ${product.price.toFixed(2)}
                         </p>
                       </div>
                     </div>

                     <div className="h-[1px] w-full bg-text-main/10" />

                     {/* Specs List */}
                     <div className="space-y-3">
                       <div className="space-y-1">
                         <p className="text-[9px] font-mono text-text-dim uppercase">Designation</p>
                         <p className="text-[10px] font-mono text-text-main uppercase">{product.category}</p>
                       </div>

                       <div className="space-y-1">
                         <p className="text-[9px] font-mono text-text-dim uppercase">Status</p>
                         <p className="text-[10px] font-mono uppercase flex items-center gap-1">
                            {product.availableForSale ? (
                              <span className="text-secondary flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Configured</span>
                            ) : (
                              <span className="text-red-500">Offline</span>
                            )}
                         </p>
                       </div>

                       <div className="space-y-1">
                         <p className="text-[9px] font-mono text-text-dim uppercase">Inventory Yield</p>
                         <p className="text-[10px] font-mono text-text-main uppercase">
                           {product.quantityAvailable !== undefined ? product.quantityAvailable : 'Unknown'}
                         </p>
                       </div>

                       <div className="space-y-1">
                         <p className="text-[9px] font-mono text-text-dim uppercase">Specs</p>
                         <p className="text-[10px] font-sans text-text-main line-clamp-4 leading-relaxed max-w-full">
                           {product.description || 'No data file attached.'}
                         </p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
