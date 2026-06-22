import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Terminal, ShieldCheck, Box, CheckCircle, Package, Download, ShoppingBag, RotateCcw } from 'lucide-react';
import { fetchShopifyOrders, ShopifyOrder } from '../../lib/shopifyService';
import { useNotificationStore } from '../../store/notificationStore';
import { useCartStore } from '../../store/cartStore';
import jsPDF from 'jspdf';

type Tab = 'ALL' | 'ACTIVE' | 'FULFILLED';

export default function HistoryView() {
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const addNotification = useNotificationStore(state => state.addNotification);
  const addToCart = useCartStore(state => state.addToCart);
  const setIsCartOpen = useCartStore(state => state.setIsCartOpen);
  const prevOrdersRef = useRef<ShopifyOrder[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const fetchedOrders = await fetchShopifyOrders(15);
        if (mounted) {
          setOrders(fetchedOrders);
          setLoading(false);
          
          // Check for dispatched/delivered orders for real-time notification simulation
          if (prevOrdersRef.current.length > 0) {
            fetchedOrders.forEach(order => {
              const prevOrder = prevOrdersRef.current.find(o => o.id === order.id);
              if (prevOrder && prevOrder.status !== 'FULFILLED' && order.status === 'FULFILLED') {
                addNotification({
                  type: 'success',
                  message: `Acquisition Manifest ${order.name} has been dispatched!`,
                });
              }
            });
          }
          prevOrdersRef.current = fetchedOrders;
        }
      } catch (err: any) {
        if (mounted) {
          addNotification({
            type: 'error',
            message: 'Failed to sync historical databanks.'
          });
          setLoading(false);
        }
      }
    }
    
    loadOrders();
    const interval = setInterval(loadOrders, 30000); // Poll every 30s for updates
    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, [addNotification]);

  const handleBuyAgain = (order: ShopifyOrder) => {
    order.items.forEach(item => {
      addToCart({
        id: item.id,
        name: item.title,
        price: item.price || 0,
        image: item.image,
        images: [item.image],
        category: 'Re-Acquisition',
        description: `Re-assessed from Manifest ${order.name}`,
        availableForSale: true,
      });
    });
    
    setIsCartOpen(true);
    addNotification({
      type: 'success',
      message: 'Items from order added to terminal cart.'
    });
  };

  const generateInvoice = (order: ShopifyOrder) => {
    try {
      const doc = new jsPDF();
      
      doc.setFillColor(11, 18, 27); // Dark background
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setTextColor(0, 229, 255); // Cyan
      doc.setFontSize(22);
      doc.text("LITLOOT SECURE INVOICE", 20, 20);
      
      doc.setTextColor(255, 255, 255); // White
      doc.setFontSize(12);
      doc.text(`Manifest ID: ${order.name}`, 20, 35);
      doc.text(`Timestamp: ${new Date(order.createdAt).toLocaleString()}`, 20, 45);
      doc.text(`Status: ${order.status}`, 20, 55);
      doc.text(`Financial Status: ${order.financialStatus}`, 20, 65);
      
      let y = 85;
      doc.setTextColor(0, 229, 255);
      doc.setFontSize(14);
      doc.text("PAYLOAD ITEMS:", 20, y);
      y += 10;
      
      doc.setTextColor(148, 163, 184); // Muted text
      doc.setFontSize(12);
      order.items.forEach(item => {
        doc.text(`- ${item.quantity}x ${item.title.substring(0, 55)}`, 20, y);
        y += 10;
      });
      
      y += 15;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.text(`TOTAL ASSESSED: ${order.total.toFixed(2)} ${order.currency}`, 20, y);
      
      doc.save(`LitLoot_Manifest_${order.name.replace('#', '')}.pdf`);
      
      addNotification({
        type: 'success',
        message: `Encrypted invoice downloaded successfully.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Invoice generation failed. Try again.'
      });
    }
  };

  const getStatusStep = (status: string) => {
    switch(status.toUpperCase()) {
      case 'UNFULFILLED': return 1;
      case 'PARTIALLY_FULFILLED': return 2;
      case 'FULFILLED': return 3;
      default: return 0;
    }
  };

  const statusSteps = [
    { label: 'PROCESSED', icon: ShieldCheck },
    { label: 'PACKAGED', icon: Box },
    { label: 'DISPATCHED', icon: Package }
  ];

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return order.status !== 'FULFILLED';
    if (activeTab === 'FULFILLED') return order.status === 'FULFILLED';
    return true;
  });

  return (
    <div className="space-y-8 md:space-y-12 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-[150px] sm:h-[200px] cyber-corners bg-gradient-to-br from-surface to-primary border border-secondary/20 overflow-hidden p-6 md:p-10 flex flex-col justify-center force-gpu-layer"
      >
         <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
         <div className="relative z-10 space-y-2">
           <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-[0.85] tracking-tighter uppercase text-text-main text-glow">
             ACQUISITION<br />HISTORY
           </h1>
           <p className="text-text-dim max-w-md text-xs font-mono opacity-80 uppercase tracking-widest leading-relaxed">
             Secure transaction logs and real-time shipping telemetrics.
           </p>
         </div>
      </motion.div>

      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-text-main flex items-center gap-3">
            <Terminal className="w-4 h-4 text-secondary" />
            OPERATIONAL LOGS
          </h2>

          <div className="flex bg-surface p-1 border border-secondary/20 rounded-sm">
            {(['ALL', 'ACTIVE', 'FULFILLED'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-secondary/20 text-secondary border border-secondary/50' 
                    : 'text-text-dim hover:text-text-main hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center border border-secondary/20 cyber-corners bg-surface/50">
             <div className="flex items-center gap-3 text-secondary font-mono tracking-widest text-xs animate-pulse">
               <Terminal className="w-4 h-4" />
               DECRYPTING LOGS...
             </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-40 flex flex-col items-center justify-center border border-secondary/20 cyber-corners bg-surface/50 gap-4 text-center p-6"
          >
             <div className="w-12 h-12 rounded-full border border-secondary/30 flex items-center justify-center glow-cyan-sm">
                <History className="w-5 h-5 text-secondary opacity-60" />
             </div>
             <div>
                <p className="font-display tracking-[0.2em] font-black uppercase text-sm text-text-main">No records found</p>
                <p className="text-xs font-mono text-text-dim mt-1">Acquisition manifests are currently empty.</p>
             </div>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const currentStep = getStatusStep(order.status);
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    key={order.id}
                    style={{ willChange: 'transform, opacity' }}
                    className="bg-surface/60 border border-secondary/20 cyber-corners overflow-hidden group force-gpu-layer"
                  >
                    <div className="p-4 sm:p-6 border-b border-secondary/10 bg-gradient-to-r from-primary/40 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                         <div className="flex items-center gap-3">
                            <span className="font-display text-sm md:text-base font-black tracking-widest uppercase text-text-main group-hover:text-glow transition-all">
                               {order.name}
                            </span>
                            <span className="px-2 py-0.5 bg-secondary/10 border border-secondary/30 text-[9px] font-mono font-black text-secondary uppercase tracking-widest rounded-xs">
                              {order.financialStatus}
                            </span>
                         </div>
                         <p className="text-[10px] font-mono text-text-dim mt-1 track-widest uppercase">
                           Initiated: {new Date(order.createdAt).toLocaleDateString()}
                         </p>
                      </div>
                      
                      <div className="flex flex-col md:items-end gap-2">
                        <p className="font-display text-xl font-black text-text-main tracking-tighter">
                          {order.total.toFixed(2)} <span className="text-xs tracking-widest text-text-dim">{order.currency}</span>
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => generateInvoice(order)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-secondary/30 text-[9px] font-mono text-text-main hover:text-secondary hover:border-secondary transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            INVOICE
                          </button>
                          
                          {order.status === 'FULFILLED' && (
                            <button 
                              onClick={() => handleBuyAgain(order)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 border border-secondary/40 text-[9px] font-mono text-secondary hover:bg-secondary/20 transition-colors"
                            >
                              <RotateCcw className="w-3 h-3" />
                              RE-ACQUIRE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-8">
                      {/* Progress Bar */}
                      <div className="relative">
                         <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px] bg-secondary/20" />
                         <div 
                           className="absolute top-1/2 -translate-y-1/2 left-0 h-[1px] bg-secondary shadow-[0_0_10px_#00f3ff] transition-transform duration-1000 ease-out origin-left force-gpu-layer"
                           style={{ transform: `scaleX(${Math.max(0.05, currentStep / statusSteps.length)})`, width: '100%' }}
                         />

                         <div className="relative z-10 flex justify-between items-center px-4 md:px-12">
                           {statusSteps.map((step, i) => {
                              const isCompleted = i < currentStep;
                              const isActive = i === currentStep - 1 || (currentStep === 0 && i === 0);
                              const Icon = step.icon;

                              return (
                                <div key={step.label} className="flex flex-col items-center gap-3">
                                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${isCompleted || isActive ? 'bg-primary border-secondary shadow-[0_0_15px_rgba(0,229,255,0.3)]' : 'bg-primary border-secondary/20 grayscale opacity-50'}`}>
                                     {isCompleted && !isActive ? (
                                       <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                                     ) : (
                                       <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-text-main text-glow' : 'text-text-dim'}`} />
                                     )}
                                  </div>
                                  <span className={`text-[8px] sm:text-[9px] font-mono tracking-[0.2em] uppercase ${isActive ? 'text-secondary font-bold' : 'text-text-dim'}`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                           })}
                         </div>
                      </div>

                      {/* Items */}
                      <div className="bg-primary/30 border border-secondary/10 p-4 space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-mono text-secondary/60 pb-2 border-b border-secondary/10">
                          Payload Items
                        </p>
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-10 h-10 border border-secondary/20 bg-surface cyber-corners overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80" />
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-display font-medium uppercase tracking-wider text-text-main truncate">
                                 {item.title}
                               </p>
                               <p className="text-[10px] font-mono text-text-dim mt-0.5">
                                 QTY: {item.quantity} {item.price > 0 && `| ${item.price.toFixed(2)}`}
                               </p>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
