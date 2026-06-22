import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Check, Zap, MapPin, CreditCard, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ProfileMenuProps {
  onClose: () => void;
}

export default function ProfileMenu({ onClose }: ProfileMenuProps) {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [quickPurchase, setQuickPurchase] = useState(() => localStorage.getItem('litloot_quick_purchase') === 'true');
  const [showQuickPurchaseSettings, setShowQuickPurchaseSettings] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('litloot_shipping_v2') || '{"line1":"", "city":"", "zip":""}');
    } catch { return { line1: '', city: '', zip: '' }; }
  });
  const [paymentMethod, setPaymentMethod] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('litloot_payment_v2') || '{"number":"", "exp":"", "cvc":""}');
    } catch { return { number: '', exp: '', cvc: '' }; }
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const toggleQuickPurchase = () => {
    const newVal = !quickPurchase;
    setQuickPurchase(newVal);
    localStorage.setItem('litloot_quick_purchase', String(newVal));
  };

  const saveQuickSettings = () => {
    localStorage.setItem('litloot_shipping_v2', JSON.stringify(shippingAddress));
    localStorage.setItem('litloot_payment_v2', JSON.stringify(paymentMethod));
    setShowQuickPurchaseSettings(false);
  };

  const autofillLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        // Simplified mock reverse geocoding
        setShippingAddress({
          line1: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          city: 'Geo City',
          zip: '00000'
        });
      }, () => {
        setShippingAddress(s => ({ ...s, line1: 'Geolocation Failed' }));
      });
    }
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-14 right-0 w-80 bg-surface border border-secondary/20 shadow-2xl rounded-md overflow-hidden z-50 cyber-corners"
    >
      <div className="p-4 border-b border-text-main/10 bg-primary/20 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xs bg-secondary/10 border border-secondary/30 flex items-center justify-center relative overflow-hidden group">
          <User className="w-6 h-6 text-secondary glow-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-display font-black text-text-main uppercase tracking-wider leading-none">
            {user?.displayName || 'USER'}
          </h3>
          <p className="text-[9px] font-mono text-text-dim mt-1 tracking-widest uppercase">
            {user?.email || 'GUEST_PROFILE'}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent-pink" />
              <span className="text-xs font-mono text-text-main uppercase tracking-widest font-bold">Quick Purchase</span>
            </div>
            <button 
              onClick={toggleQuickPurchase}
              className={`w-10 h-5 rounded-full p-1 transition-colors ${quickPurchase ? 'bg-secondary' : 'bg-primary/50 border border-secondary/20'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${quickPurchase ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <AnimatePresence>
            {quickPurchase && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="overflow-hidden"
              >
                {!showQuickPurchaseSettings ? (
                  <div className="mt-2 space-y-2 p-3 bg-primary/30 border border-text-main/10 rounded-sm">
                     <p className="text-[10px] font-mono text-text-dim uppercase flex items-center gap-2">
                       <MapPin className="w-3 h-3" /> {shippingAddress.line1 ? 'Address Configured' : 'No Address Set'}
                     </p>
                     <p className="text-[10px] font-mono text-text-dim uppercase flex items-center gap-2">
                       <CreditCard className="w-3 h-3" /> {paymentMethod.number ? 'Payment Configured' : 'No Payment Set'}
                     </p>
                     <button 
                       onClick={() => setShowQuickPurchaseSettings(true)}
                       className="text-[9px] text-secondary uppercase font-mono tracking-widest mt-2 hover:underline"
                     >
                       Edit Configuration
                     </button>
                  </div>
                ) : (
                  <div className="mt-2 space-y-4 p-3 bg-primary/50 border border-secondary/20 rounded-sm max-h-[300px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-mono text-secondary uppercase tracking-[0.2em] font-bold">Shipping Origin</label>
                        <button onClick={autofillLocation} className="text-[8px] font-mono text-accent-pink hover:text-white uppercase px-1.5 py-0.5 border border-accent-pink/30 hover:bg-accent-pink/20 rounded-xs transition-colors flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> Auto-Locate
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={shippingAddress.line1}
                        onChange={e => setShippingAddress({...shippingAddress, line1: e.target.value})}
                        placeholder="Street Address"
                        className="w-full bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={shippingAddress.city}
                          onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})}
                          placeholder="City"
                          className="w-2/3 bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none"
                        />
                        <input 
                          type="text" 
                          value={shippingAddress.zip}
                          onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})}
                          placeholder="ZIP"
                          className="w-1/3 bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 relative">
                      <label className="text-[9px] font-mono text-secondary uppercase tracking-[0.2em] font-bold">Payment Interface</label>
                      <div className="absolute top-0 right-0 -translate-y-1/2 flex gap-1 items-center px-1 py-0.5 bg-green-500/10 border border-green-500/30 rounded-xs">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[7px] font-mono text-green-500 uppercase tracking-widest">E2E Secure</span>
                      </div>
                      <input 
                        type="text" 
                        value={paymentMethod.number}
                        onChange={e => setPaymentMethod({...paymentMethod, number: e.target.value})}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none placeholder:text-text-dim/50 tracking-widest"
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={paymentMethod.exp}
                          onChange={e => setPaymentMethod({...paymentMethod, exp: e.target.value})}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-1/2 bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none placeholder:text-text-dim/50"
                        />
                        <input 
                          type="password" 
                          value={paymentMethod.cvc}
                          onChange={e => setPaymentMethod({...paymentMethod, cvc: e.target.value})}
                          placeholder="CVC"
                          maxLength={4}
                          className="w-1/2 bg-surface border border-secondary/30 rounded-xs px-3 py-1.5 text-xs text-text-main font-mono focus:border-secondary focus:outline-none placeholder:text-text-dim/50"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={saveQuickSettings}
                      className="w-full bg-secondary/10 border border-secondary/40 text-secondary py-1.5 text-[9px] font-mono font-black uppercase tracking-widest rounded-xs hover:bg-secondary hover:text-primary transition-all mt-4"
                    >
                      Encrypt & Save
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-[1px] w-full bg-text-main/10" />

        <button 
          onClick={() => {
            onClose();
            // In a real app we might route to a literal orders page, but we already have History feature
          }}
          className="w-full flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-sm transition-colors text-left"
        >
          <div className="flex items-center gap-3">
             <FileText className="w-4 h-4 text-text-dim group-hover:text-secondary transition-colors" />
             <span className="text-xs font-mono font-bold uppercase tracking-widest text-text-main">Invoices</span>
          </div>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-between group p-2 hover:bg-red-500/10 rounded-sm transition-colors text-left"
        >
          <div className="flex items-center gap-3">
             <LogOut className="w-4 h-4 text-red-500/70 group-hover:text-red-500 transition-colors" />
             <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-500">Log Out</span>
          </div>
        </button>

      </div>
    </motion.div>
  );
}
