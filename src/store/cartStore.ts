import { create } from 'zustand';
import { Product, CartItem } from '../types';
import { useAuthStore } from './authStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

interface CartState {
  cartItems: CartItem[];
  selectedIds: string[];
  isCartOpen: boolean;
  isInitialized: boolean;
  
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  purgeItems: (ids: string[]) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleSelection: (id: string) => void;
  setAllSelected: (selected: boolean) => void;
  
  initCartListener: () => () => void;
  cartCount: () => number;
  cartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => {
  return {
    cartItems: [],
    selectedIds: [],
    isCartOpen: false,
    isInitialized: false,

    setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

    cartCount: () => get().cartItems.reduce((sum, item) => sum + item.quantity, 0),
    cartTotal: () => get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),

    initCartListener: () => {
      const { user } = useAuthStore.getState();
      let unsubscribe = () => {};

      if (!user) {
        const saved = localStorage.getItem('litloot_cart');
        const savedSelection = localStorage.getItem('litloot_cart_selection');
        set({ 
          cartItems: saved ? JSON.parse(saved) : [],
          selectedIds: savedSelection ? JSON.parse(savedSelection) : [],
          isInitialized: true
        });
        return unsubscribe;
      }

      try {
        const cartRef = collection(db, 'users', user.uid, 'cart');
        unsubscribe = onSnapshot(cartRef, 
          (snapshot) => {
            const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CartItem));
            set({ cartItems: items, isInitialized: true });
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}/cart`);
          }
        );
      } catch (error) {
        console.error('Failed to initialize cart listener:', error);
      }
      return unsubscribe;
    },

    addToCart: async (product) => {
      const { cartItems } = get();
      const existing = cartItems.find(item => item.id === product.id);
      const newQty = existing ? existing.quantity + 1 : 1;
      const user = useAuthStore.getState().user;

      if (user) {
        const itemPath = `users/${user.uid}/cart/${product.id}`;
        try {
          const itemRef = doc(db, itemPath);
          await setDoc(itemRef, {
            ...product,
            quantity: newQty,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, itemPath);
        }
      } else {
        set((state) => {
          const newItems = existing 
            ? state.cartItems.map(item => item.id === product.id ? { ...item, quantity: newQty } : item)
            : [...state.cartItems, { ...product, quantity: 1 }];
          localStorage.setItem('litloot_cart', JSON.stringify(newItems));
          return { cartItems: newItems };
        });
      }
    },

    removeFromCart: async (id) => {
      const user = useAuthStore.getState().user;
      if (user) {
        const itemPath = `users/${user.uid}/cart/${id}`;
        try {
          const itemRef = doc(db, itemPath);
          await deleteDoc(itemRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, itemPath);
        }
      } else {
        set((state) => {
          const newItems = state.cartItems.filter(item => item.id !== id);
          localStorage.setItem('litloot_cart', JSON.stringify(newItems));
          return { cartItems: newItems };
        });
      }
    },

    updateQuantity: async (id, delta) => {
      const { cartItems } = get();
      const item = cartItems.find(i => i.id === id);
      if (!item) return;

      const newQty = Math.max(1, item.quantity + delta);
      const user = useAuthStore.getState().user;

      if (user) {
        const itemPath = `users/${user.uid}/cart/${id}`;
        try {
          const itemRef = doc(db, itemPath);
          await setDoc(itemRef, { 
            quantity: newQty,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, itemPath);
        }
      } else {
        set((state) => {
          const newItems = state.cartItems.map(i => i.id === id ? { ...i, quantity: newQty } : i);
          localStorage.setItem('litloot_cart', JSON.stringify(newItems));
          return { cartItems: newItems };
        });
      }
    },

    purgeItems: async (ids) => {
      const user = useAuthStore.getState().user;
      if (user) {
        const basePath = `users/${user.uid}/cart`;
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            batch.delete(doc(db, basePath, id));
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, basePath);
        }
      } else {
        set((state) => {
          const newItems = state.cartItems.filter(item => !ids.includes(item.id));
          localStorage.setItem('litloot_cart', JSON.stringify(newItems));
          return { cartItems: newItems };
        });
      }
    },

    clearCart: async () => {
      const user = useAuthStore.getState().user;
      const { cartItems } = get();
      if (user) {
        const basePath = `users/${user.uid}/cart`;
        try {
          const batch = writeBatch(db);
          cartItems.forEach(item => {
            batch.delete(doc(db, basePath, item.id));
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, basePath);
        }
      } else {
        set({ cartItems: [] });
        localStorage.setItem('litloot_cart', JSON.stringify([]));
      }
    },

    toggleSelection: (id) => {
      set((state) => {
        const newIds = state.selectedIds.includes(id) 
          ? state.selectedIds.filter(i => i !== id) 
          : [...state.selectedIds, id];
        if (!useAuthStore.getState().user) {
          localStorage.setItem('litloot_cart_selection', JSON.stringify(newIds));
        }
        return { selectedIds: newIds };
      });
    },

    setAllSelected: (selected) => {
      set((state) => {
        const newIds = selected ? state.cartItems.map(item => item.id) : [];
        if (!useAuthStore.getState().user) {
          localStorage.setItem('litloot_cart_selection', JSON.stringify(newIds));
        }
        return { selectedIds: newIds };
      });
    }
  };
});

// Watch for auth changes to re-init listener
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.uid !== prevState.user?.uid) {
    useCartStore.getState().initCartListener();
  }
});
