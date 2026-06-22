import { create } from 'zustand';
import { Product, WishlistItem } from '../types';
import { useAuthStore } from './authStore';
import { useCartStore } from './cartStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';

interface WishlistState {
  wishlistItems: WishlistItem[];
  isInitialized: boolean;
  isWishlistOpen: boolean;
  
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (id: string) => boolean;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleSelection: (id: string) => void;
  selectAll: (selected: boolean) => void;
  removeItems: (ids: string[]) => Promise<void>;
  addSelectedToCart: () => Promise<void>;
  addAllToCart: () => Promise<void>;
  reorderItems: (newItems: WishlistItem[]) => void;
  initWishlistListener: () => () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => {
  return {
    wishlistItems: [],
    isInitialized: false,
    isWishlistOpen: false,

    setIsWishlistOpen: (open) => set({ isWishlistOpen: open }),

    isInWishlist: (id) => get().wishlistItems.some(item => item.id === id),

    toggleWishlist: async (product) => {
      const { wishlistItems } = get();
      const existing = wishlistItems.find(item => item.id === product.id);
      const user = useAuthStore.getState().user;

      if (user) {
        const itemPath = `users/${user.uid}/wishlist/${product.id}`;
        try {
          const itemRef = doc(db, itemPath);
          if (existing) {
            await deleteDoc(itemRef);
          } else {
            const cleanProduct = Object.fromEntries(
              Object.entries(product).filter(([_, v]) => v !== undefined)
            );
            await setDoc(itemRef, {
              ...cleanProduct,
              quantity: 1,
              isPinned: false,
              addedAt: serverTimestamp()
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, itemPath);
        }
      } else {
        set((state) => {
          const newItems = existing 
            ? state.wishlistItems.filter(item => item.id !== product.id)
            : [...state.wishlistItems, { ...product, quantity: 1, isPinned: false, selected: false }];
          localStorage.setItem('litloot_wishlist', JSON.stringify(newItems));
          return { wishlistItems: newItems };
        });
      }
    },

    updateQuantity: async (id, delta) => {
      const user = useAuthStore.getState().user;
      const item = get().wishlistItems.find(i => i.id === id);
      if (!item) return;

      const newQty = Math.max(1, item.quantity + delta);

      if (user) {
        const itemPath = `users/${user.uid}/wishlist/${id}`;
        try {
          const itemRef = doc(db, itemPath);
          await updateDoc(itemRef, { quantity: newQty });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, itemPath);
        }
      } else {
        set(state => {
          const newItems = state.wishlistItems.map(i => 
            i.id === id ? { ...i, quantity: newQty } : i
          );
          localStorage.setItem('litloot_wishlist', JSON.stringify(newItems));
          return { wishlistItems: newItems };
        });
      }
    },

    togglePin: async (id) => {
      const user = useAuthStore.getState().user;
      const item = get().wishlistItems.find(i => i.id === id);
      if (!item) return;

      const newPinned = !item.isPinned;

      if (user) {
        const itemPath = `users/${user.uid}/wishlist/${id}`;
        try {
          const itemRef = doc(db, itemPath);
          await updateDoc(itemRef, { isPinned: newPinned });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, itemPath);
        }
      } else {
        set(state => {
          const newItems = state.wishlistItems.map(i => 
            i.id === id ? { ...i, isPinned: newPinned } : i
          ).sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
          localStorage.setItem('litloot_wishlist', JSON.stringify(newItems));
          return { wishlistItems: newItems };
        });
      }
    },

    toggleSelection: (id) => {
      set(state => ({
        wishlistItems: state.wishlistItems.map(i => 
          i.id === id ? { ...i, selected: !i.selected } : i
        )
      }));
    },

    selectAll: (selected) => {
      set(state => ({
        wishlistItems: state.wishlistItems.map(i => ({ ...i, selected }))
      }));
    },

    removeItems: async (ids) => {
      const user = useAuthStore.getState().user;
      if (user) {
        const basePath = `users/${user.uid}/wishlist`;
        try {
          const batch = writeBatch(db);
          ids.forEach(id => {
            const itemRef = doc(db, basePath, id);
            batch.delete(itemRef);
          });
          await batch.commit();
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, basePath);
        }
      } else {
        set(state => {
          const newItems = state.wishlistItems.filter(i => !ids.includes(i.id));
          localStorage.setItem('litloot_wishlist', JSON.stringify(newItems));
          return { wishlistItems: newItems };
        });
      }
    },

    addSelectedToCart: async () => {
      const selected = get().wishlistItems.filter(i => i.selected);
      if (selected.length === 0) return;

      const addToCart = useCartStore.getState().addToCart;
      for (const item of selected) {
        // Add to cart with the wishlist quantity
        for (let i = 0; i < item.quantity; i++) {
          await addToCart(item);
        }
      }

      // Optionally keep them in wishlist but deselect, or remove?
      // User said "add selected button", usually implies keeping but maybe clearing selection
      get().selectAll(false);
    },

    addAllToCart: async () => {
      const items = get().wishlistItems;
      const addToCart = useCartStore.getState().addToCart;
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          await addToCart(item);
        }
      }
    },

    reorderItems: (newItems) => {
      // Local reorder only since we sort by pinned/addedAt in Firestone
      set({ wishlistItems: newItems });
    },

    initWishlistListener: () => {
      const { user } = useAuthStore.getState();
      let unsubscribe = () => {};

      if (!user) {
        const saved = localStorage.getItem('litloot_wishlist');
        set({ 
          wishlistItems: saved ? JSON.parse(saved) : [],
          isInitialized: true
        });
        return unsubscribe;
      }

      try {
        const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
        unsubscribe = onSnapshot(wishlistRef, 
          (snapshot) => {
            const currentItems = get().wishlistItems;
            const items = snapshot.docs.map(doc => {
              const data = doc.data();
              return { 
                ...data, 
                id: doc.id,
                selected: currentItems.find(i => i.id === doc.id)?.selected ?? false 
              } as WishlistItem;
            });
            
            // Sort items: pinned first, then by addedAt
            const sortedItems = [...items].sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return (b.addedAt?.toMillis?.() || 0) - (a.addedAt?.toMillis?.() || 0);
            });

            set({ wishlistItems: sortedItems, isInitialized: true });
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}/wishlist`);
          }
        );
      } catch (error) {
        console.error('Failed to initialize wishlist listener:', error);
      }
      return unsubscribe;
    },
  };
});

// Watch for auth changes to re-init listener
useAuthStore.subscribe((state, prevState) => {
  if (state.user?.uid !== prevState.user?.uid) {
    useWishlistStore.getState().initWishlistListener();
  }
});
