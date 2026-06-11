import { create } from 'zustand';

interface AnimationData {
  id: string;
  image: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

interface CartAnimationState {
  animations: AnimationData[];
  animateToCart: (image: string, rect: DOMRect) => void;
  removeAnimation: (id: string) => void;
}

export const useCartAnimationStore = create<CartAnimationState>((set) => ({
  animations: [],
  animateToCart: (image, rect) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      animations: [
        ...state.animations,
        {
          id,
          image,
          startX: rect.left,
          startY: rect.top,
          startWidth: rect.width,
          startHeight: rect.height,
        }
      ]
    }));
  },
  removeAnimation: (id) => {
    set((state) => ({
      animations: state.animations.filter((a) => a.id !== id)
    }));
  }
}));
