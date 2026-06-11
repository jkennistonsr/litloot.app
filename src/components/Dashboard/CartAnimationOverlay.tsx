import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useCartAnimationStore } from '../../store/cartAnimationStore';

export function CartAnimationOverlay() {
  const animations = useCartAnimationStore((state) => state.animations);
  const removeAnimation = useCartAnimationStore((state) => state.removeAnimation);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {animations.map((anim) => (
          <FlyingImage 
            key={anim.id} 
            data={anim} 
            onComplete={() => removeAnimation(anim.id)} 
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

const FlyingImage: React.FC<{ data: any; onComplete: () => void }> = ({ data, onComplete }) => {
  const [target, setTarget] = useState({ x: window.innerWidth - 50, y: 50 });

  useEffect(() => {
    const trigger = document.getElementById('cart-trigger');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
  }, []);

  // Using strictly GPU-accelerated motion:
  // Instead of animating width/height, we calculate the scale reduction
  // Target size is roughly 32x32 for better visibility but small enough for a cart
  const scaleTarget = 32 / data.startWidth;
  
  return (
    <motion.div
      initial={{ 
        x: data.startX, 
        y: data.startY, 
        scale: 1,
        opacity: 0.9,
        borderRadius: '0px'
      }}
      animate={{ 
        x: target.x - (data.startWidth * scaleTarget / 2), 
        y: target.y - (data.startHeight * scaleTarget / 2),
        scale: [1, 1.1, scaleTarget],
        opacity: [0.9, 1, 0.4],
        borderRadius: ['0%', '20%', '50%']
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1], // Quartic ease out
      }}
      onAnimationComplete={onComplete}
      className="fixed top-0 left-0 overflow-hidden border-2 border-secondary shadow-[0_0_20px_#00f3ff] will-change-transform z-[9999]"
      style={{ width: data.startWidth, height: data.startHeight }}
    >
      <img 
        src={data.image} 
        alt="" 
        className="w-full h-full object-cover" 
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
}
